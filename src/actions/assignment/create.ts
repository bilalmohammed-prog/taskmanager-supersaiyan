"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

export async function createAssignment(
  userId: string,
  taskId: string,
  allocatedHours?: number
) {
  const supabase = await getSupabaseServer();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("organization_id")
    .eq("id", taskId)
    .single();

  if (taskError || !task) throw new Error(taskError?.message ?? "Task not found");

  const assignment: TablesInsert<"assignments"> = {
    user_id: userId,
    task_id: taskId,
    organization_id: task.organization_id,
    allocated_hours: allocatedHours ?? null,
  };

  const { data, error } = await supabase
    .from("assignments")
    .insert(assignment)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
