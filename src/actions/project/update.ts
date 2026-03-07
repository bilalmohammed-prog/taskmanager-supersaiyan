"use server";

import { updateProjectInDb } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";

export async function updateProjectAction(
  projectId: string,
  params: {
    name?: string;
    status?: "active" | "paused" | "archived";
    startDate?: string | null;
    endDate?: string | null;
  }
) {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  return await updateProjectInDb(supabase, {
    organizationId: ctx.organizationId,
    projectId,
    ...params,
  });
}
