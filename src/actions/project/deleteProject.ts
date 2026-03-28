"use server";

import { revalidateTag } from "next/cache";
import { softDeleteProjectInDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { uuidSchema } from "@/lib/validation/common";

export async function deleteProject(projectId: string) {
  const validatedProjectId = uuidSchema.parse(projectId);

  const ctx = await requireOrgContext();
  authorize("delete", "project", { role: ctx.role });

  await softDeleteProjectInDb(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
  });

  revalidateTag(`analytics-${ctx.organizationId}`,"default");
}
