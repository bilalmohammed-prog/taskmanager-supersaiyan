"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";
import { createProject } from "@/services/project/projectService";

export async function createProjectAction(params: {
  name: string;
  status?: "active" | "paused" | "archived";
  startDate?: string | null;
  endDate?: string | null;
}) {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  return await createProject(supabase, {
    organizationId: ctx.organizationId,
    ...params,
  });
}