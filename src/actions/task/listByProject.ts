"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { getTasksByProject } from "@/services/task/task.service";
import { uuidSchema } from "@/lib/validation/common";
import type { Tables } from "@/lib/types/database";

type TaskWithAssignee = Tables<"tasks"> & {
  assignee_id: string | null;
  assignee_name: string | null;
};

type WorkspaceAssignmentRow = {
  task_id: string;
  user_id: string;
  created_at: string | null;
};

export async function listTasksByProject(projectId: string, orgId: string) {
  console.time("[Action] workspace listTasksByProject total");
  const validatedProjectId = uuidSchema.parse(projectId);
  const validatedOrgId = uuidSchema.parse(orgId);

  console.time("[Action] workspace tasks requireOrgContext");
  const ctx = await requireOrgContext({ organizationId: validatedOrgId });
  console.timeEnd("[Action] workspace tasks requireOrgContext");

  // POTENTIAL WATERFALL
  console.time("[DB] workspace tasks");
  const tasks = await getTasksByProject(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
  });
  console.timeEnd("[DB] workspace tasks");
  if (!tasks || tasks.length === 0) {
    console.timeEnd("[Action] workspace listTasksByProject total");
    return [];
  }

  console.time("[Compute] workspace task ids");
  const taskIds = tasks.map((t) => t.id);
  console.timeEnd("[Compute] workspace task ids");

  console.time("[DB] workspace assignments");
  const { data: assignmentRows, error: assignmentError } = await ctx.supabase
    .from("assignments")
    .select("task_id,user_id,created_at")
    .eq("organization_id", ctx.organizationId)
    .in("task_id", taskIds)
    .order("created_at", { ascending: false });
  console.timeEnd("[DB] workspace assignments");

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  console.time("[Compute] workspace assignment indexes");
  const assignmentByTaskId = new Map<string, string>();

  for (const row of (assignmentRows ?? []) as WorkspaceAssignmentRow[]) {
    if (!assignmentByTaskId.has(row.task_id)) {
      assignmentByTaskId.set(row.task_id, row.user_id);
    }
  }
  console.timeEnd("[Compute] workspace assignment indexes");

  console.time("[Compute] workspace assignee ids");
  const assigneeIds = Array.from(new Set(assignmentByTaskId.values()));
  console.timeEnd("[Compute] workspace assignee ids");

  const profileById = new Map<string, string | null>();
  if (assigneeIds.length > 0) {
    console.time("[DB] workspace assignment profiles");
    const { data: profiles, error: profileError } = await ctx.supabase
      .from("profiles")
      .select("id,full_name")
      .in("id", assigneeIds);
    console.timeEnd("[DB] workspace assignment profiles");

    if (profileError) {
      throw new Error(profileError.message);
    }

    console.time("[Compute] workspace assignment profile index");
    for (const profile of profiles ?? []) {
      profileById.set(profile.id, profile.full_name);
    }
    console.timeEnd("[Compute] workspace assignment profile index");
  }

  console.time("[Compute] workspace task assignee merge");
  const mapped: TaskWithAssignee[] = tasks.map((task) => {
    const assigneeId = assignmentByTaskId.get(task.id) ?? null;
    return {
      ...task,
      assignee_id: assigneeId,
      assignee_name: assigneeId ? profileById.get(assigneeId) ?? null : null,
    };
  });
  console.timeEnd("[Compute] workspace task assignee merge");
  console.timeEnd("[Action] workspace listTasksByProject total");

  return mapped;
}
