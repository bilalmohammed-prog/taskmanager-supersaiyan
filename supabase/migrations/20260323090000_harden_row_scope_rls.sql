-- Migration: Harden row-scoped RLS for tenant data access.
-- Focus tables:
-- messages, comments, assignments, tasks, project_members, org_members.

begin;

-- ---------------------------------------------------------------------------
-- 1) Helper functions for composable row-authorization checks
-- ---------------------------------------------------------------------------

create or replace function public.can_access_project(project_uuid uuid, org_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_org_member(org_uuid)
    and (
      public.org_role(org_uuid) in ('owner', 'admin')
      or exists (
        select 1
        from public.project_members pm
        where pm.organization_id = org_uuid
          and pm.project_id = project_uuid
          and pm.user_id = auth.uid()
          and pm.left_at is null
      )
    );
$$;

create or replace function public.can_access_task(task_uuid uuid, org_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = task_uuid
      and t.organization_id = org_uuid
      and t.deleted_at is null
      and (
        (t.project_id is null and public.is_org_member(org_uuid))
        or
        (t.project_id is not null and public.can_access_project(t.project_id, org_uuid))
      )
  );
$$;

revoke all on function public.can_access_project(uuid, uuid) from public;
revoke all on function public.can_access_task(uuid, uuid) from public;
grant execute on function public.can_access_project(uuid, uuid) to authenticated;
grant execute on function public.can_access_task(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) messages (critical)
-- ---------------------------------------------------------------------------

drop policy if exists messages_select_member on public.messages;

create policy messages_select_member
on public.messages
for select
to authenticated
using (
  public.is_org_member(organization_id)
  and deleted_at is null
  and (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 3) org_members (row scope + role-scoped visibility)
-- ---------------------------------------------------------------------------

drop policy if exists org_members_select_member on public.org_members;
drop policy if exists org_members_insert_owner_admin_or_bootstrap_owner on public.org_members;
drop policy if exists org_members_update_owner_admin on public.org_members;
drop policy if exists org_members_delete_owner_admin on public.org_members;

create policy org_members_select_member
on public.org_members
for select
to authenticated
using (
  public.is_org_member(organization_id)
  and (
    user_id = auth.uid()
    or public.org_role(organization_id) in ('owner', 'admin', 'manager')
  )
);

create policy org_members_insert_owner_admin_or_bootstrap_owner
on public.org_members
for insert
to authenticated
with check (
  (
    public.org_role(organization_id) in ('owner', 'admin')
    and public.is_org_member(organization_id)
  )
  or (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1
      from public.org_members existing
      where existing.organization_id = org_members.organization_id
    )
  )
);

create policy org_members_update_owner_admin
on public.org_members
for update
to authenticated
using (
  public.is_org_member(organization_id)
  and public.org_role(organization_id) in ('owner', 'admin')
)
with check (
  public.is_org_member(organization_id)
  and public.org_role(organization_id) in ('owner', 'admin')
);

create policy org_members_delete_owner_admin
on public.org_members
for delete
to authenticated
using (
  public.is_org_member(organization_id)
  and public.org_role(organization_id) in ('owner', 'admin')
);

-- ---------------------------------------------------------------------------
-- 4) project_members (project-scoped read + hardened mutations)
-- ---------------------------------------------------------------------------

drop policy if exists project_members_select_member on public.project_members;
drop policy if exists project_members_insert_owner_admin on public.project_members;
drop policy if exists project_members_update_owner_admin on public.project_members;
drop policy if exists project_members_delete_owner_admin on public.project_members;

create policy project_members_select_member
on public.project_members
for select
to authenticated
using (
  public.is_org_member(organization_id)
  and public.can_access_project(project_id, organization_id)
);

create policy project_members_insert_owner_admin
on public.project_members
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and public.org_role(organization_id) in ('owner', 'admin')
  and exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.organization_id = project_members.organization_id
      and p.deleted_at is null
  )
  and exists (
    select 1
    from public.org_members om
    where om.organization_id = project_members.organization_id
      and om.user_id = project_members.user_id
  )
);

create policy project_members_update_owner_admin
on public.project_members
for update
to authenticated
using (
  public.is_org_member(organization_id)
  and public.org_role(organization_id) in ('owner', 'admin')
)
with check (
  public.is_org_member(organization_id)
  and public.org_role(organization_id) in ('owner', 'admin')
  and exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.organization_id = project_members.organization_id
      and p.deleted_at is null
  )
  and exists (
    select 1
    from public.org_members om
    where om.organization_id = project_members.organization_id
      and om.user_id = project_members.user_id
  )
);

create policy project_members_delete_owner_admin
on public.project_members
for delete
to authenticated
using (
  public.is_org_member(organization_id)
  and public.org_role(organization_id) in ('owner', 'admin')
);

-- ---------------------------------------------------------------------------
-- 5) tasks (project/task-scoped read + hardened mutations)
-- ---------------------------------------------------------------------------

drop policy if exists tasks_select_member on public.tasks;
drop policy if exists tasks_insert_member on public.tasks;
drop policy if exists tasks_update_member on public.tasks;
drop policy if exists tasks_delete_member on public.tasks;

create policy tasks_select_member
on public.tasks
for select
to authenticated
using (public.can_access_task(id, organization_id));

create policy tasks_insert_member
on public.tasks
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and (
    created_by is null
    or created_by = auth.uid()
    or public.org_role(organization_id) in ('owner', 'admin')
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and p.organization_id = tasks.organization_id
        and p.deleted_at is null
    )
  )
  and (
    project_id is null
    or public.can_access_project(project_id, organization_id)
  )
);

create policy tasks_update_member
on public.tasks
for update
to authenticated
using (public.can_access_task(id, organization_id))
with check (
  public.is_org_member(organization_id)
  and (
    created_by is null
    or created_by = auth.uid()
    or public.org_role(organization_id) in ('owner', 'admin')
  )
  and (
    project_id is null
    or exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and p.organization_id = tasks.organization_id
        and p.deleted_at is null
    )
  )
  and (
    project_id is null
    or public.can_access_project(project_id, organization_id)
  )
);

create policy tasks_delete_member
on public.tasks
for delete
to authenticated
using (
  public.can_access_task(id, organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or created_by = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 6) assignments (task-scoped read + hardened mutations)
-- ---------------------------------------------------------------------------

drop policy if exists assignments_select_member on public.assignments;
drop policy if exists assignments_insert_member on public.assignments;
drop policy if exists assignments_update_member on public.assignments;
drop policy if exists assignments_delete_member on public.assignments;

create policy assignments_select_member
on public.assignments
for select
to authenticated
using (
  public.can_access_task(task_id, organization_id)
  and (
    user_id = auth.uid()
    or public.org_role(organization_id) in ('owner', 'admin', 'manager')
  )
);

create policy assignments_insert_member
on public.assignments
for insert
to authenticated
with check (
  public.can_access_task(task_id, organization_id)
  and (
    user_id = auth.uid()
    or public.org_role(organization_id) in ('owner', 'admin', 'manager')
  )
  and exists (
    select 1
    from public.tasks t
    where t.id = assignments.task_id
      and t.organization_id = assignments.organization_id
      and t.deleted_at is null
  )
  and exists (
    select 1
    from public.org_members om
    where om.organization_id = assignments.organization_id
      and om.user_id = assignments.user_id
  )
);

create policy assignments_update_member
on public.assignments
for update
to authenticated
using (
  public.can_access_task(task_id, organization_id)
  and (
    user_id = auth.uid()
    or public.org_role(organization_id) in ('owner', 'admin', 'manager')
  )
)
with check (
  public.can_access_task(task_id, organization_id)
  and (
    user_id = auth.uid()
    or public.org_role(organization_id) in ('owner', 'admin', 'manager')
  )
  and exists (
    select 1
    from public.tasks t
    where t.id = assignments.task_id
      and t.organization_id = assignments.organization_id
      and t.deleted_at is null
  )
  and exists (
    select 1
    from public.org_members om
    where om.organization_id = assignments.organization_id
      and om.user_id = assignments.user_id
  )
);

create policy assignments_delete_member
on public.assignments
for delete
to authenticated
using (
  public.can_access_task(task_id, organization_id)
  and (
    user_id = auth.uid()
    or public.org_role(organization_id) in ('owner', 'admin', 'manager')
  )
);

-- ---------------------------------------------------------------------------
-- 7) comments (task-scoped read + hardened mutations)
-- ---------------------------------------------------------------------------

drop policy if exists comments_select_member on public.comments;
drop policy if exists comments_insert_member_as_author on public.comments;
drop policy if exists comments_update_owner_admin_or_author on public.comments;
drop policy if exists comments_delete_owner_admin_or_author on public.comments;

create policy comments_select_member
on public.comments
for select
to authenticated
using (public.can_access_task(task_id, organization_id));

create policy comments_insert_member_as_author
on public.comments
for insert
to authenticated
with check (
  public.can_access_task(task_id, organization_id)
  and user_id = auth.uid()
  and exists (
    select 1
    from public.tasks t
    where t.id = comments.task_id
      and t.organization_id = comments.organization_id
      and t.deleted_at is null
      and (
        comments.project_id is null
        or comments.project_id = t.project_id
      )
  )
);

create policy comments_update_owner_admin_or_author
on public.comments
for update
to authenticated
using (
  public.can_access_task(task_id, organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or user_id = auth.uid()
  )
)
with check (
  public.can_access_task(task_id, organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tasks t
    where t.id = comments.task_id
      and t.organization_id = comments.organization_id
      and t.deleted_at is null
      and (
        comments.project_id is null
        or comments.project_id = t.project_id
      )
  )
);

create policy comments_delete_owner_admin_or_author
on public.comments
for delete
to authenticated
using (
  public.can_access_task(task_id, organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or user_id = auth.uid()
  )
);

commit;
