"use server";

import { updateProjectInDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
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

  const ctx = await requireOrgContext();
  authorize("update", "project", { role: ctx.role });
  return await updateProjectInDb(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
    ...validatedParams,
  });
}
