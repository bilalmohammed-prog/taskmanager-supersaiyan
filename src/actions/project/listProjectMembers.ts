"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listProjectMembers(projectId: string) {
  const supabase = await getSupabaseServer();

  const { data: members, error } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .is("left_at", null);

  if (error) throw new Error(error.message);

  const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));
  if (userIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", userIds);

  if (profileError) throw new Error(profileError.message);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? ""]));

  return userIds.map((user_id) => ({
    user_id,
    name: nameById.get(user_id) ?? "",
  }));
}
