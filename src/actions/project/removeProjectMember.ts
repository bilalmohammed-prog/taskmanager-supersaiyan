"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function removeProjectMember(
  projectId: string,
  resourceId: string
) {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("project_members")
    .update({
      left_at: new Date().toISOString()
    })
    .eq("project_id", projectId)
    .eq("resource_id", resourceId);

  if (error) throw new Error(error.message);
}