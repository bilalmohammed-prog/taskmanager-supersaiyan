"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getAnalyticsSummaryFromDb } from "@/lib/api";
import { requireTenantContext } from "@/services/tenant";

export async function getAnalyticsSummary() {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  return await getAnalyticsSummaryFromDb(supabase, ctx.organizationId);
}
