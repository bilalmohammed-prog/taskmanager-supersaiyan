"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listTasksByProject(
  projectId: string,
  orgId: string
) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}