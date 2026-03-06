"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";
import { cookies } from "next/headers";

export async function createResource(
  name: string,
  type: "human" | "equipment" | "room" | "vehicle" | "software"
) {
  const supabase = await getSupabaseServer();
  const cookieStore = await cookies();

  const orgId = cookieStore.get("activeOrg")?.value;
  if (!orgId) throw new Error("No active organization");

  const resourceInsert: TablesInsert<"resources"> = {
    name,
    type,
    organization_id: orgId,
  };

  const { data, error } = await supabase
    .from("resources")
    .insert(resourceInsert)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
