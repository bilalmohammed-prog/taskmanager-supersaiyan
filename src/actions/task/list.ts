"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function listTasks() {
  const supabase = await getSupabaseServer();
  const cookieStore = await cookies();

  const orgId = cookieStore.get("activeOrg")?.value;
  if (!orgId) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .is("deleted_at", null);


  if (error) throw new Error(error.message);

  return data;
}
