"use server";

import { createProjectInDb } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";

export async function createProjectAction(params: {
  name: string;
  status?: "active" | "paused" | "archived";
  startDate?: string | null;
  endDate?: string | null;
}) {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  return await createProjectInDb(supabase, {
    organizationId: ctx.organizationId,
    ...params,
  });
}
