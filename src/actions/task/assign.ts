"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function assignTaskToResource(
  taskId: string,
  resourceId: string
) {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("resource_assignments")
    .insert({
      task_id: taskId,
      resource_id: resourceId
    });

  if (error) throw new Error(error.message);
}
