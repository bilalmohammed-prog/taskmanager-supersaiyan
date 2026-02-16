"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/types";


export async function updateTask(
  taskId: string,
  updates: TablesUpdate<"tasks">,
  orgId: string
) {

  const supabase = await getSupabaseServer();

  
  if (!orgId) throw new Error("No active organization");

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
