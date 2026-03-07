"use server";

import { listProjectsFromDb } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";

export async function listProjectsAction() {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  return await listProjectsFromDb(supabase, ctx.organizationId);
}
