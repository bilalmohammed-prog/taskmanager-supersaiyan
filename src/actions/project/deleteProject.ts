"use server";

import { softDeleteProjectInDb } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";

export async function deleteProject(projectId: string) {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  await softDeleteProjectInDb(supabase, {
    organizationId: ctx.organizationId,
    projectId,
  });
}
