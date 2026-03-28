"use server";

import { revalidateTag } from "next/cache";
import { createProjectInDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { projectCreateSchema } from "@/lib/validation/project";


export async function createProjectAction(params: {
  name: string;
  status?: "active" | "paused" | "archived";
  startDate?: string | null;
  endDate?: string | null;
}) {
  const validated = projectCreateSchema.parse(params);

  const ctx = await requireOrgContext();
  authorize("create", "project", { role: ctx.role });

  const result = await createProjectInDb(ctx.supabase, {
    organizationId: ctx.organizationId,
    ...validated,
  });

  revalidateTag(`analytics-${ctx.organizationId}`,"default");

  return result;
}
