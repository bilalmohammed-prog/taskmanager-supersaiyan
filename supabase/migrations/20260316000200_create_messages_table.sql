-- Migration: create messages table with multi-tenant RLS policies.
-- Supports direct messages (recipient_id) or project messages (project_id).

begin;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid null references public.profiles(id) on delete cascade,
  project_id uuid null references public.projects(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz null,
  constraint messages_target_check check (
    (recipient_id is not null and project_id is null)
    or
    (recipient_id is null and project_id is not null)
  )
);

create index if not exists idx_messages_org_created_at
  on public.messages (organization_id, created_at desc);
create index if not exists idx_messages_sender
  on public.messages (organization_id, sender_id, created_at desc);
create index if not exists idx_messages_recipient
  on public.messages (organization_id, recipient_id, created_at desc);
create index if not exists idx_messages_project
  on public.messages (organization_id, project_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists messages_select_member on public.messages;
drop policy if exists messages_insert_member_as_sender on public.messages;
drop policy if exists messages_update_owner_admin_or_sender on public.messages;
drop policy if exists messages_delete_owner_admin_or_sender on public.messages;

-- Members can read messages inside their organization.
create policy messages_select_member
on public.messages
for select
to authenticated
using (
  public.is_org_member(organization_id)
  and deleted_at is null
);

-- Members can create messages in their organization as themselves.
-- Target must be either a valid org member recipient or an in-org project.
create policy messages_insert_member_as_sender
on public.messages
for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and sender_id = auth.uid()
  and (
    (
      recipient_id is not null
      and exists (
        select 1
        from public.org_members om
        where om.organization_id = messages.organization_id
          and om.user_id = messages.recipient_id
      )
    )
    or
    (
      project_id is not null
      and exists (
        select 1
        from public.projects p
        where p.id = messages.project_id
          and p.organization_id = messages.organization_id
          and p.deleted_at is null
      )
    )
  )
);

-- Owner/admin can update any message in-org; sender can update their own.
-- Used for soft delete and potential content edits.
create policy messages_update_owner_admin_or_sender
on public.messages
for update
to authenticated
using (
  public.is_org_member(organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or sender_id = auth.uid()
  )
)
with check (
  public.is_org_member(organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or sender_id = auth.uid()
  )
);

-- Owner/admin can hard-delete any message in-org; sender can delete own.
create policy messages_delete_owner_admin_or_sender
on public.messages
for delete
to authenticated
using (
  public.is_org_member(organization_id)
  and (
    public.org_role(organization_id) in ('owner', 'admin')
    or sender_id = auth.uid()
  )
);

commit;
