"use server";

import { updateProjectInDb } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { uuidSchema } from "@/lib/validation/common";
import { projectUpdateSchema } from "@/lib/validation/project";

export async function updateProjectAction(
  projectId: string,
  params: {
    name?: string;
    status?: "active" | "paused" | "archived";
    startDate?: string | null;
    endDate?: string | null;
  }
) {
  const validatedProjectId = uuidSchema.parse(projectId);
  const validatedParams = projectUpdateSchema.parse(params);

  const supabase = await getSupabaseServer();
  const ctx = await requireOrgContext({ supabase });
  return await updateProjectInDb(supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
    ...validatedParams,
  });
}