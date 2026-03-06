"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/types/database";
import { cookies } from "next/headers";

export async function updateResource(
  resourceId: string,
  updates: TablesUpdate<"resources">
) {
  const supabase = await getSupabaseServer();
  const cookieStore = await cookies();

  const orgId = cookieStore.get("activeOrg")?.value;
  if (!orgId) throw new Error("No active organization");

  const { data, error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", resourceId)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
