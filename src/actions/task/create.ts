"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { createTask as createTaskService } from "@/services/task/task.service";
import type { Tables } from "@/lib/types/database";
import {
  uuidSchema,
  nonEmptyStringSchema,
  optionalTextSchema,
  isoDateStringSchema,
} from "@/lib/validation/common";

export async function createTask(
  title: string,
  description: string | undefined,
  dueDate: string | null,
  orgId: string,
  project_id: string | null
): Promise<Tables<"tasks">> {
  const validatedTitle = nonEmptyStringSchema.parse(title);
  const validatedDescription = optionalTextSchema.optional().parse(description);
  const validatedDueDate = isoDateStringSchema.nullable().optional().parse(dueDate);
  const validatedOrgId = uuidSchema.parse(orgId);
  const validatedProjectId = uuidSchema.parse(project_id);

  const ctx = await requireOrgContext({ organizationId: validatedOrgId });
  return await createTaskService(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
    title: validatedTitle,
    description: validatedDescription,
    dueDate: validatedDueDate ?? undefined,
  });
}
