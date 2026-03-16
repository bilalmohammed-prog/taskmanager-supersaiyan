-- Migration: Enforce multi-tenant RLS across core tables
-- Tables covered:
-- organizations, profiles, org_members, projects, project_members,
-- tasks, assignments, comments, manager_employees.

begin;

-- ---------------------------------------------------------------------------
-- 1) Helper functions used by RLS policies
-- ---------------------------------------------------------------------------

-- Returns true when the current authenticated user belongs to the org.
create or replace function public.is_org_member(org_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members om
    where om.organization_id = org_uuid
      and om.user_id = auth.uid()
  );
$$;

-- Returns the current authenticated user's highest role in the org, if any.
create or replace function public.org_role(org_uuid uuid)
returns public.role_type
language sql
stable
security definer
set search_path = public
as $$
  select om.role
  from public.org_members om
  where om.organization_id = org_uuid
    and om.user_id = auth.uid()
  order by case om.role
    when 'owner' then 1
    when 'admin' then 2
    when 'manager' then 3
    when 'employee' then 4
    when 'viewer' then 5
    else 100
  end
  limit 1
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.org_role(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.org_role(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Enable RLS on all tenant-sensitive tables
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.org_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.assignments enable row level security;
alter table public.comments enable row level security;
alter table public.manager_employees enable row level security;

-- ---------------------------------------------------------------------------
-- 3) Drop existing policies to keep migration idempotent
-- ---------------------------------------------------------------------------

-- organizations
drop policy if exists organizations_select_member on public.organizations;
drop policy if exists organizations_insert_authenticated on public.organizations;
drop policy if exists organizations_update_owner_admin on public.organizations;
drop policy if exists organizations_delete_owner_admin on public.organizations;

-- profiles
drop policy if exists profiles_select_self_or_shared_org on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_update_owner_admin_same_org on public.profiles;
drop policy if exists profiles_delete_self_or_owner_admin_same_org on public.profiles;

-- org_members
drop policy if exists org_members_select_member on public.org_members;
drop policy if exists org_members_insert_owner_admin_or_bootstrap_owner on public.org_members;
drop policy if exists org_members_update_owner_admin on public.org_members;
drop policy if exists org_members_delete_owner_admin on public.org_members;

-- projects
drop policy if exists projects_select_member on public.projects;
drop policy if exists projects_insert_member on public.projects;
drop policy if exists projects_update_member on public.projects;
drop policy if exists projects_delete_member on public.projects;

-- project_members
drop policy if exists project_members_select_member on public.project_members;
drop policy if exists project_members_insert_owner_admin on public.project_members;
drop policy if exists project_members_update_owner_admin on public.project_members;
drop policy if exists project_members_delete_owner_admin on public.project_members;

-- tasks
drop policy if exists tasks_select_member on public.tasks;
drop policy if exists tasks_insert_member on public.tasks;
drop policy if exists tasks_update_member on public.tasks;
drop policy if exists tasks_delete_member on public.tasks;

-- assignments
drop policy if exists assignments_select_member on public.assignments;
drop policy if exists assignments_insert_member on public.assignments;
drop policy if exists assignments_update_member on public.assignments;
drop policy if exists assignments_delete_member on public.assignments;

-- comments
drop policy if exists comments_select_member on public.comments;
drop policy if exists comments_insert_member_as_author on public.comments;
drop policy if exists comments_update_owner_admin_or_author on public.comments;
drop policy if exists comments_delete_owner_admin_or_author on public.comments;

-- manager_employees
drop policy if exists manager_employees_select_member on public.manager_employees;
drop policy if exists manager_employees_insert_owner_admin on public.manager_employees;
drop policy if exists manager_employees_update_owner_admin on public.manager_employees;
drop policy if exists manager_employees_delete_owner_admin on public.manager_employees;

-- ---------------------------------------------------------------------------
-- 4) organizations policies
-- ---------------------------------------------------------------------------

-- Members can view only organizations they belong to.
create policy organizations_select_member
on public.organizations
for select
using (public.is_org_member(id));

-- Any authenticated user may create an organization row.
-- Ownership bootstrap is enforced when inserting into org_members.
create policy organizations_insert_authenticated
on public.organizations
for insert
to authenticated
with check (auth.uid() is not null);

-- Only owner/admin in that organization can update it.
create policy organizations_update_owner_admin
on public.organizations
for update
to authenticated
using (public.org_role(id) in ('owner', 'admin'))
with check (public.org_role(id) in ('owner', 'admin'));

-- Only owner/admin in that organization can delete it.
create policy organizations_delete_owner_admin
on public.organizations
for delete
to authenticated
using (public.org_role(id) in ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- 5) profiles policies
-- ---------------------------------------------------------------------------

-- Users can read their own profile, plus profiles of users sharing any org.
create policy profiles_select_self_or_shared_org
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.org_members me
    join public.org_members them
      on them.organization_id = me.organization_id
    where me.user_id = auth.uid()
      and them.user_id = profiles.id
  )
);

-- Users can insert only their own profile row.
create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Users can update only their own profile by default.
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Owner/admin can update profiles for users in their organization.
create policy profiles_update_owner_admin_same_org
on public.profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.org_members actor
    join public.org_members target
      on target.organization_id = actor.organization_id
    where actor.user_id = auth.uid()
      and actor.role in ('owner', 'admin')
      and target.user_id = profiles.id
  )
)
with check (
  exists (
    select 1
    from public.org_members actor
    join public.org_members target
      on target.organization_id = actor.organization_id
    where actor.user_id = auth.uid()
      and actor.role in ('owner', 'admin')
      and target.user_id = profiles.id
  )
);

-- Users can delete their own profile; owner/admin can delete profile rows
-- for members in their organization when elevated administration is required.
create policy profiles_delete_self_or_owner_admin_same_org
on public.profiles
for delete
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.org_members actor
    join public.org_members target
      on target.organization_id = actor.organization_id
    where actor.user_id = auth.uid()
      and actor.role in ('owner', 'admin')
      and target.user_id = profiles.id
  )
);

-- ---------------------------------------------------------------------------
-- 6) org_members policies (role-management restricted to owner/admin)
-- ---------------------------------------------------------------------------

-- Users can view membership rows only inside orgs they belong to.
create policy org_members_select_member
on public.org_members
for select
to authenticated
using (public.is_org_member(organization_id));

-- Membership insert is limited to owner/admin in the org.
-- Bootstrap exception: first membership row in a new org must be self + owner.
create policy org_members_insert_owner_admin_or_bootstrap_owner
on public.org_members
for insert
to authenticated
with check (
  (
    public.org_role(organization_id) in ('owner', 'admin')
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

-- Only owner/admin can update membership roles or records.
create policy org_members_update_owner_admin
on public.org_members
for update
to authenticated
using (public.org_role(organization_id) in ('owner', 'admin'))
with check (public.org_role(organization_id) in ('owner', 'admin'));

-- Only owner/admin can remove memberships.
create policy org_members_delete_owner_admin
on public.org_members
for delete
to authenticated
using (public.org_role(organization_id) in ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- 7) projects policies
-- ---------------------------------------------------------------------------

-- Members can read projects in their organization.
create policy projects_select_member
on public.projects
for select
to authenticated
using (public.is_org_member(organization_id));

-- Members can create projects in their organization.
create policy projects_insert_member
on public.projects
for insert
to authenticated
with check (public.is_org_member(organization_id));

-- Members can update projects in their organization.
create policy projects_update_member
on public.projects
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Members can delete projects in their organization.
create policy projects_delete_member
on public.projects
for delete
to authenticated
using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 8) project_members policies (role-management restricted to owner/admin)
-- ---------------------------------------------------------------------------

-- Members can read project membership inside their organization.
create policy project_members_select_member
on public.project_members
for select
to authenticated
using (public.is_org_member(organization_id));

-- Only owner/admin can add project members.
create policy project_members_insert_owner_admin
on public.project_members
for insert
to authenticated
with check (
  public.org_role(organization_id) in ('owner', 'admin')
  and public.is_org_member(organization_id)
);

-- Only owner/admin can update project member metadata/role.
create policy project_members_update_owner_admin
on public.project_members
for update
to authenticated
using (public.org_role(organization_id) in ('owner', 'admin'))
with check (public.org_role(organization_id) in ('owner', 'admin'));

-- Only owner/admin can remove project members.
create policy project_members_delete_owner_admin
on public.project_members
for delete
to authenticated
using (public.org_role(organization_id) in ('owner', 'admin'));

-- ---------------------------------------------------------------------------
-- 9) tasks policies
-- ---------------------------------------------------------------------------

-- Members can read tasks only in their organization.
create policy tasks_select_member
on public.tasks
for select
to authenticated
using (public.is_org_member(organization_id));

-- Members can create tasks only in their organization.
create policy tasks_insert_member
on public.tasks
for insert
to authenticated
with check (public.is_org_member(organization_id));

-- Members can update tasks only in their organization.
create policy tasks_update_member
on public.tasks
for update
to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

-- Members can delete tasks only in their organization.
create policy tasks_delete_member
on public.tasks
for delete
to authenticated
using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 10) assignments policies
-- ---------------------------------------------------------------------------

-- Members can read assignments in their organization.
create policy assignments_select_member
on public.assignments
for select
to authenticated
using (public.is_org_member(organization_id));

-- Members can create assignments in their organization.
-- The task must also exist in the same organization.
create policy assignments_insert_member
on public.assignments
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and exists (
    select 1
    from public.tasks t
    where t.id = assignments.task_id
      and t.organization_id = assignments.organization_id
      and t.deleted_at is null
  )
);

-- Members can update assignments in their organization.
-- Keep task/org consistency on updates too.
create policy assignments_update_member
on public.assignments
for update
to authenticated
using (public.is_org_member(organization_id))
with check (
  public.is_org_member(organization_id)
  and exists (
    select 1
    from public.tasks t
    where t.id = assignments.task_id
      and t.organization_id = assignments.organization_id
      and t.deleted_at is null
  )
);

-- Members can delete assignments in their organization.
create policy assignments_delete_member
on public.assignments
for delete
to authenticated
using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 11) comments policies
-- ---------------------------------------------------------------------------

-- Members can read comments in their organization.
create policy comments_select_member
on public.comments
for select
to authenticated
using (public.is_org_member(organization_id));

-- Members can create comments in their organization as themselves only.
-- Comment must reference a task in the same organization.
create policy comments_insert_member_as_author
on public.comments
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and user_id = auth.uid()
  and exists (
    select 1
    from public.tasks t
    where t.id = comments.task_id
      and t.organization_id = comments.organization_id
      and t.deleted_at is null
  )
);

-- Owner/admin can edit any comment in-org; authors can edit their own.
create policy comments_update_owner_admin_or_author
on public.comments
for update
to authenticated
using (
  public.is_org_member(organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or user_id = auth.uid()
  )
)
with check (
  public.is_org_member(organization_id)
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
  )
);

-- Owner/admin can delete any comment in-org; authors can delete their own.
create policy comments_delete_owner_admin_or_author
on public.comments
for delete
to authenticated
using (
  public.is_org_member(organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 12) manager_employees policies
-- ---------------------------------------------------------------------------

-- Members can read manager-employee mappings in their organization.
create policy manager_employees_select_member
on public.manager_employees
for select
to authenticated
using (public.is_org_member(organization_id));

-- Only owner/admin can create manager-employee mappings.
create policy manager_employees_insert_owner_admin
on public.manager_employees
for insert
to authenticated
with check (
  public.org_role(organization_id) in ('owner', 'admin')
  and exists (
    select 1
    from public.org_members m1
    where m1.organization_id = manager_employees.organization_id
      and m1.user_id = manager_employees.manager_id
  )
  and exists (
    select 1
    from public.org_members m2
    where m2.organization_id = manager_employees.organization_id
      and m2.user_id = manager_employees.employee_id
  )
);

-- Only owner/admin can update manager-employee mappings.
create policy manager_employees_update_owner_admin
on public.manager_employees
for update
to authenticated
using (public.org_role(organization_id) in ('owner', 'admin'))
with check (
  public.org_role(organization_id) in ('owner', 'admin')
  and exists (
    select 1
    from public.org_members m1
    where m1.organization_id = manager_employees.organization_id
      and m1.user_id = manager_employees.manager_id
  )
  and exists (
    select 1
    from public.org_members m2
    where m2.organization_id = manager_employees.organization_id
      and m2.user_id = manager_employees.employee_id
  )
);

-- Only owner/admin can delete manager-employee mappings.
create policy manager_employees_delete_owner_admin
on public.manager_employees
for delete
to authenticated
using (public.org_role(organization_id) in ('owner', 'admin'));

commit;
