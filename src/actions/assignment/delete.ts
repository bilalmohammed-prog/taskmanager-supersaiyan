"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function deleteAssignment(assignmentId: string) {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("resource_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) throw new Error(error.message);

  return true;
}
