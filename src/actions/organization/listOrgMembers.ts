"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listOrgMembers(orgId: string) {
  const supabase = await getSupabaseServer();

  // first get org members
  const { data: members, error: memberError } =
    await supabase
      .from("org_members")
      .select("user_id")
      .eq("organization_id", orgId);

  if (memberError) throw new Error(memberError.message);

  const userIds = members?.map(m => m.user_id) ?? [];

  if (userIds.length === 0) return [];

  // then fetch profiles
  const { data: profiles, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

  if (profileError) throw new Error(profileError.message);

  return (profiles ?? []).map(p => ({
    resource_id: p.id,
    name: p.full_name ?? "Unknown"
  }));
}