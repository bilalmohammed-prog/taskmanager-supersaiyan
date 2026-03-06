"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/types/database";

export async function updateAssignment(
  assignmentId: string,
  updates: TablesUpdate<"resource_assignments">
) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("resource_assignments")
    .update(updates)
    .eq("id", assignmentId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
