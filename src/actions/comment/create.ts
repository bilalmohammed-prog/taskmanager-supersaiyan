"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { createCommentForTask } from "@/services/task/comment.service";
import { uuidSchema } from "@/lib/validation/common";
import { commentCreateSchema } from "@/lib/validation/comment";

export async function createComment(taskId: string, content: string) {
  const validatedTaskId = uuidSchema.parse(taskId);
  const { content: validatedContent } = commentCreateSchema.parse({ content });

  const ctx = await requireOrgContext();
  authorize("create", "comment", { role: ctx.role });
  return await createCommentForTask(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    taskId: validatedTaskId,
    content: validatedContent,
  });
}
