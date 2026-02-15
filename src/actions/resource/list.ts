"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function listResources() {
  const supabase = await getSupabaseServer();
  const cookieStore = await cookies();

  const orgId = cookieStore.get("activeOrg")?.value;
  if (!orgId) return [];

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}
