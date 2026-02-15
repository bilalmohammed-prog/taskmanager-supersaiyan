"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listAssignments() {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("resource_assignments")
    .select(`
      *,
      resource:resources (id, name, type),
      task:tasks (id, title, status)
    `);

  if (error) throw new Error(error.message);

  return data;
}
