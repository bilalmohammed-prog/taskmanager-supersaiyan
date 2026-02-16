"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function deleteTask(taskId: string, orgId: string) {
  const supabase = await getSupabaseServer();

  if (!orgId) throw new Error("No active organization");

  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  return true;
}
