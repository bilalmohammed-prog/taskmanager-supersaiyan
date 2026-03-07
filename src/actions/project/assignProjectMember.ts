"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function assignProjectMember(
  projectId: string,
  userId: string,
  orgId: string
) {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("project_members")
    .upsert(
      {
        project_id: projectId,
        user_id: userId,
        organization_id: orgId,
        left_at: null,
      },
      {
        onConflict: "project_id,user_id",
      }
    );

  if (error) throw new Error(error.message);
}
