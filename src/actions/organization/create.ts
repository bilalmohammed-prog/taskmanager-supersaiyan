"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";

export async function createOrganization(name: string, slug: string) {
  const supabase = await getSupabaseServer();

  // 1. Get logged in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // 2. Insert organization
  const orgInsert: TablesInsert<"organizations"> = {
    name,
    slug,
  };

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert(orgInsert)
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization");
  }

  // 3. Add creator as owner in org_members
  const { error: memberError } = await supabase
    .from("org_members")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    throw new Error(memberError.message);
  }

  return org;
}
