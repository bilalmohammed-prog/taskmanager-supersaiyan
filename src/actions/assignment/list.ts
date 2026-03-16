"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { listAssignmentsFromDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

export async function listAssignments() {
  const supabase = await getSupabaseServer();
  const ctx = await requireOrgContext({ supabase });
  return await listAssignmentsFromDb(supabase, ctx.organizationId);
}
