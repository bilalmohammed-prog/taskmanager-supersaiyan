"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listAssignments } from "@/services/resource/assignment.service";
import { getTasksByProject } from "@/services/task/task.service";
import { uuidSchema } from "@/lib/validation/common";
import type { Tables } from "@/lib/types/database";

type TaskWithAssignee = Tables<"tasks"> & {
  assignee_id: string | null;
  assignee_name: string | null;
};

export async function listTasksByProject(projectId: string, orgId: string) {
  const validatedProjectId = uuidSchema.parse(projectId);
  const validatedOrgId = uuidSchema.parse(orgId);

  const ctx = await requireOrgContext({ organizationId: validatedOrgId });
  const tasks = await getTasksByProject(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
  });
  if (!tasks || tasks.length === 0) return [];

  const taskIds = tasks.map((t) => t.id);
  const assignmentRows = await listAssignments(ctx.supabase, {
    organizationId: ctx.organizationId,
  });
  const assignmentsForProjectTasks = assignmentRows.filter((row) =>
    taskIds.includes(row.task_id)
  );

  const assignmentByTaskId = new Map<string, string>();
  const profileById = new Map<string, string | null>();

  for (const row of assignmentsForProjectTasks) {
    if (!assignmentByTaskId.has(row.task_id)) {
      assignmentByTaskId.set(row.task_id, row.user_id);
    }
    if (row.profile) {
      profileById.set(row.profile.id, row.profile.name);
    }
  }

  const mapped: TaskWithAssignee[] = tasks.map((task) => {
    const assigneeId = assignmentByTaskId.get(task.id) ?? null;
    return {
      ...task,
      assignee_id: assigneeId,
      assignee_name: assigneeId ? profileById.get(assigneeId) ?? null : null,
    };
  });

  return mapped;
}