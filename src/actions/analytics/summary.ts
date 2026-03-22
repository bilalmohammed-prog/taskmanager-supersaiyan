"use server";

import { unstable_cache } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getAnalyticsSummaryFromDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

export async function getAnalyticsSummary() {
  const supabase = await getSupabaseServer();
  const ctx = await requireOrgContext({ supabase });

  const getCached = unstable_cache(
    async () => getAnalyticsSummaryFromDb(supabase, ctx.organizationId),
    [`analytics-summary-${ctx.organizationId}`],
    {
      tags: [`analytics-${ctx.organizationId}`],
      revalidate: 60,
    }
  );

  return getCached();
}