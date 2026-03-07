"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { listAssignmentsFromDb } from "@/lib/api";
import { requireTenantContext } from "@/services/tenant";

export async function listAssignments() {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  return await listAssignmentsFromDb(supabase, ctx.organizationId);
}
