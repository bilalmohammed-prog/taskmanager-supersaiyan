"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function removeProjectMember(projectId: string, userId: string) {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("project_members")
    .update({
      left_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("project_id", projectId)
    .is("deleted_at", null);

  if (taskError) throw new Error(taskError.message);

  const taskIds = (tasks ?? []).map((t) => t.id);
  if (taskIds.length === 0) return;

  const { error: assignmentError } = await supabase
    .from("assignments")
    .delete()
    .eq("user_id", userId)
    .in("task_id", taskIds);

  if (assignmentError) throw new Error(assignmentError.message);
}
