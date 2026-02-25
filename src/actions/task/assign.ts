"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function assignTaskToResource(
  taskId: string,
  resourceId: string | null
) {
  const supabase = await getSupabaseServer();

  // UNASSIGN
  if (!resourceId) {
    const { error } = await supabase
      .from("resource_assignments")
      .delete()
      .eq("task_id", taskId);

    if (error) throw new Error(error.message);
    return;
  }

  // ASSIGN / REASSIGN (single query)
  const { error } = await supabase
    .from("resource_assignments")
    .upsert(
      {
        task_id: taskId,
        resource_id: resourceId,
      },
      {
        onConflict: "task_id",
      }
    );

  if (error) throw new Error(error.message);
}