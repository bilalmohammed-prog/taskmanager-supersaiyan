"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

type TaskWithAssignee = Tables<"tasks"> & {
  assignee_id: string | null;
  assignee_name: string | null;
};

export async function listTasksByProject(projectId: string, orgId: string) {
  const supabase = await getSupabaseServer();

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (tasksError) throw new Error(tasksError.message);
  if (!tasks || tasks.length === 0) return [];

  const taskIds = tasks.map((t) => t.id);

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("assignments")
    .select("task_id,user_id")
    .eq("organization_id", orgId)
    .in("task_id", taskIds);

  if (assignmentError) throw new Error(assignmentError.message);

  const userIds = Array.from(new Set((assignmentRows ?? []).map((a) => a.user_id)));
  const profileById = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id,full_name")
      .in("id", userIds);

    if (profileError) throw new Error(profileError.message);

    for (const profile of profiles ?? []) {
      profileById.set(profile.id, profile.full_name);
    }
  }

  const assignmentByTaskId = new Map<string, string>();
  for (const row of assignmentRows ?? []) {
    if (!assignmentByTaskId.has(row.task_id)) {
      assignmentByTaskId.set(row.task_id, row.user_id);
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
