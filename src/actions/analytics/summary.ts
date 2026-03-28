"use server";

import { unstable_cache } from "next/cache";
import { getAnalyticsSummaryFromDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

export async function getAnalyticsSummary() {
  const ctx = await requireOrgContext();

  const getCached = unstable_cache(
    async () => getAnalyticsSummaryFromDb(ctx.supabase, ctx.organizationId),
    [`analytics-summary-${ctx.organizationId}`],
    {
      tags: [`analytics-${ctx.organizationId}`],
      revalidate: 60,
    }
  );

  return getCached();
}
