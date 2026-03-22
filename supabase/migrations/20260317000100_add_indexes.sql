-- Assignments: most queried by org + user and org + task
CREATE INDEX IF NOT EXISTS idx_assignments_org_user
  ON assignments (organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_assignments_org_task
  ON assignments (organization_id, task_id);

-- Tasks: queried by org + project and org + status
CREATE INDEX IF NOT EXISTS idx_tasks_org_project
  ON tasks (organization_id, project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_org_status
  ON tasks (organization_id, status)
  WHERE deleted_at IS NULL;

-- Comments: queried by org + task
CREATE INDEX IF NOT EXISTS idx_comments_org_task
  ON comments (organization_id, task_id);

-- Messages: queried by org + recipient and org + sender
CREATE INDEX IF NOT EXISTS idx_messages_org_recipient
  ON messages (organization_id, recipient_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_org_sender
  ON messages (organization_id, sender_id)
  WHERE deleted_at IS NULL;

-- Project members: queried by org + project
CREATE INDEX IF NOT EXISTS idx_project_members_org_project
  ON project_members (organization_id, project_id)
  WHERE left_at IS NULL;

-- Org members: queried by org
CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON org_members (organization_id);