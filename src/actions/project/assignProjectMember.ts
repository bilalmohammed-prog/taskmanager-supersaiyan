"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function assignProjectMember(
  projectId: string,
  userId: string, // ← coming from org_members
  orgId: string
) {
  const supabase = await getSupabaseServer();

  // -------------------------------------------------
  // 1️⃣ find matching resource
  // -------------------------------------------------
  const { data: resource } = await supabase
    .from("resources")
    .select("id")
    .eq("id", userId) // works because your ids currently match
    .single();

  let resourceId = resource?.id;

  // -------------------------------------------------
  // 2️⃣ create resource if missing
  // -------------------------------------------------
  if (!resourceId) {
    const { data: created, error: createError } =
      await supabase
        .from("resources")
        .insert({
          id: userId,
          organization_id: orgId,
          name: "New Member",
          type: "human"
        })
        .select("id")
        .single();

    if (createError) throw new Error(createError.message);

    resourceId = created.id;
  }

  // -------------------------------------------------
  // 3️⃣ your original upsert (unchanged)
  // -------------------------------------------------
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