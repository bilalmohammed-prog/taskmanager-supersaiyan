"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";
import { updateProject } from "@/services/project/projectService";

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
  return await updateProject(supabase, {
    organizationId: ctx.organizationId,
    projectId,
    ...params,
  });
}