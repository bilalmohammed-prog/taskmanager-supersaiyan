"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { getTasksByProject } from "@/services/task/task.service";
import { listProjectMembers as listProjectMembersService } from "@/services/resource/projectMember.service";
import { uuidSchema } from "@/lib/validation/common";

type WorkspaceAssignmentRow = {
  task_id: string;
  user_id: string;
  created_at: string | null;
};

export async function loadProjectWorkspace(
  projectId: string,
  organizationId: string
) {
  console.time("[Action] loadProjectWorkspace total");

  const validatedProjectId = uuidSchema.parse(projectId);
  const validatedOrgId = uuidSchema.parse(organizationId);

  // ONE context load only
  const ctx = await requireOrgContext({
    organizationId: validatedOrgId,
  });

  const [tasks, members] = await Promise.all([
    getTasksByProject(ctx.supabase, {
      organizationId: ctx.organizationId,
      projectId: validatedProjectId,
    }),

    listProjectMembersService(ctx.supabase, {
      organizationId: ctx.organizationId,
      projectId: validatedProjectId,
    }),
  ]);

  const taskIds = tasks.map((t) => t.id);

  let assignmentRows: WorkspaceAssignmentRow[] = [];

  if (taskIds.length > 0) {
    const { data, error } = await ctx.supabase
      .from("assignments")
      .select("task_id,user_id,created_at")
      .eq("organization_id", ctx.organizationId)
      .in("task_id", taskIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    assignmentRows = (data ?? []) as WorkspaceAssignmentRow[];
  }

  const assignmentByTaskId = new Map<string, string>();

  for (const row of assignmentRows) {
    if (!assignmentByTaskId.has(row.task_id)) {
      assignmentByTaskId.set(row.task_id, row.user_id);
    }
  }

  const assigneeIds = Array.from(
    new Set(assignmentByTaskId.values())
  );

  const profileById = new Map<string, string | null>();

  if (assigneeIds.length > 0) {
    const { data: profiles, error } = await ctx.supabase
      .from("profiles")
      .select("id,full_name")
      .in("id", assigneeIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const profile of profiles ?? []) {
      profileById.set(profile.id, profile.full_name);
    }
  }

  const mappedTasks = tasks.map((task) => {
    const assigneeId = assignmentByTaskId.get(task.id) ?? null;

    return {
      ...task,
      assignee_id: assigneeId,
      assignee_name: assigneeId
        ? profileById.get(assigneeId) ?? null
        : null,
    };
  });

  const mappedMembers = members.map((member) => ({
    user_id: member.user_id,
    name: member.full_name ?? "",
  }));

  console.timeEnd("[Action] loadProjectWorkspace total");

  return {
    tasks: mappedTasks,
    members: mappedMembers,
  };
}