"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listProjectMembers(
  projectId: string
) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("project_members")
    .select(`
      resource_id,
      resources!inner (
        id,
        name
      )
    `)
    .eq("project_id", projectId)
    .is("left_at", null);

  if (error) throw new Error(error.message);

 return (
  data?.map(m => {
    const resource = Array.isArray(m.resources)
      ? m.resources[0]
      : m.resources;

    return {
      resource_id: m.resource_id,
      name: resource?.name ?? ""
    };
  }) ?? []
);
}