"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";
import { listProjects } from "@/services/project/projectService";

export async function listProjectsAction() {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  return await listProjects(supabase, {
    organizationId: ctx.organizationId,
  });
}