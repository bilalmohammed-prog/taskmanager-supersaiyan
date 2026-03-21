"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listCommentsForTask } from "@/services/task/comment.service";
import { uuidSchema } from "@/lib/validation/common";

export async function listComments(taskId: string) {
  const validatedTaskId = uuidSchema.parse(taskId);

  const ctx = await requireOrgContext();
  return await listCommentsForTask(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId: validatedTaskId,
  });
}