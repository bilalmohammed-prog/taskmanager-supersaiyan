"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";
import { softDeleteProject } from "@/services/project/projectService";

export async function deleteProject(projectId: string) {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  await softDeleteProject(supabase, {
    organizationId: ctx.organizationId,
    projectId,
  });
}