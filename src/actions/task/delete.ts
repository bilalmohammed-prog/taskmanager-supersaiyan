"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function deleteTask(taskId: string) {
  const supabase = await getSupabaseServer();
  const cookieStore = await cookies();

  const orgId = cookieStore.get("activeOrg")?.value;
  if (!orgId) throw new Error("No active organization");

  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  return true;
}
