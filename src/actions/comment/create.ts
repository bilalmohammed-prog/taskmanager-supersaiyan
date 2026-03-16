"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { createCommentForTask } from "@/services/task/comment.service";

export async function createComment(taskId: string, content: string) {
  const ctx = await requireOrgContext();
  return await createCommentForTask(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    taskId,
    content,
  });
}
