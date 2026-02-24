"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listTasksByProject(
  projectId: string,
  orgId: string
) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
  .from("tasks")
  .select(`
    *,
    resource_assignments (
      resources (
        name
      )
    )
  `)
  .eq("project_id", projectId)
  .eq("organization_id", orgId)
  .is("deleted_at", null)
  .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
const mapped =
  data?.map(task => ({
    ...task,
    assignee_name:
      task.resource_assignments?.[0]
        ?.resources?.name ?? null
  })) ?? [];
return mapped;
}