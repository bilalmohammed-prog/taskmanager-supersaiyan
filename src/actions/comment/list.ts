"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listCommentsForTask } from "@/services/task/comment.service";

export async function listComments(taskId: string) {
  const ctx = await requireOrgContext();
  return await listCommentsForTask(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId,
  });
}
