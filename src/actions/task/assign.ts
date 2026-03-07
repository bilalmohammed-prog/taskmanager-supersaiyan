"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function assignTaskToResource(
  taskId: string,
  userId: string | null
) {
  const supabase = await getSupabaseServer();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("organization_id")
    .eq("id", taskId)
    .single();

  if (taskError || !task) throw new Error(taskError?.message ?? "Task not found");

  // UNASSIGN
  if (!userId) {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("task_id", taskId);

    if (error) throw new Error(error.message);
    return;
  }

  // ASSIGN / REASSIGN (single query)
  await supabase.from("assignments").delete().eq("task_id", taskId);

  const { error } = await supabase.from("assignments").insert({
    task_id: taskId,
    user_id: userId,
    organization_id: task.organization_id,
  });

  if (error) throw new Error(error.message);
}
