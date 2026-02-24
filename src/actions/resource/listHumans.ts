"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listHumanResources(orgId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("resources")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("type", "human")
    .is("deleted_at", null)
    .order("name");

  if (error) throw new Error(error.message);

  return data ?? [];
}