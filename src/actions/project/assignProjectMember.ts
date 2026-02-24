"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function assignProjectMember(
  projectId: string,
  resourceId: string
) {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("project_members")
    .upsert(
      {
        project_id: projectId,
        resource_id: resourceId,
        left_at: null
      },
      {
        onConflict: "project_id,resource_id"
      }
    );

  if (error) throw new Error(error.message);
}