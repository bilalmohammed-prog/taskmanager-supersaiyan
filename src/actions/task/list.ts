"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listTasks(employeeId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("assignments")
    .select(`
      allocated_hours,
      start_time,
      end_time,
      tasks!inner (
        id,
        title,
        status,
        due_date,
        deleted_at
      )
    `)
    .eq("user_id", employeeId)
    .is("tasks.deleted_at", null);

  if (error) throw new Error(error.message);
  return data;
}
