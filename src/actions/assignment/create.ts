"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

export async function createAssignment(
  resourceId: string,
  taskId: string,
  allocatedHours?: number
) {
  const supabase = await getSupabaseServer();

  const assignment: TablesInsert<"resource_assignments"> = {
    resource_id: resourceId,
    task_id: taskId,
    allocated_hours: allocatedHours ?? null,
  };

  const { data, error } = await supabase
    .from("resource_assignments")
    .insert(assignment)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
