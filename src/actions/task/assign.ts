"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function assignTaskToResource(
  taskId: string,
  resourceId: string | null
) {
  const supabase = await getSupabaseServer();

  // remove existing assignment first
  const { error: deleteError } = await supabase
    .from("resource_assignments")
    .delete()
    .eq("task_id", taskId);

  if (deleteError) throw new Error(deleteError.message);

  // unassign case
  if (!resourceId) return;

  // insert new assignment
  const { error } = await supabase
    .from("resource_assignments")
    .insert({
      task_id: taskId,
      resource_id: resourceId
    });

  if (error) throw new Error(error.message);
}