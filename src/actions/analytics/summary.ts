"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { getAnalyticsSummaryFromDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

export async function getAnalyticsSummary() {
  const supabase = await getSupabaseServer();
  const ctx = await requireOrgContext({ supabase });
  return await getAnalyticsSummaryFromDb(supabase, ctx.organizationId);
}
