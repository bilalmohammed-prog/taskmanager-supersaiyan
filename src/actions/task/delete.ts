"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { deleteTask as deleteTaskService } from "@/services/task/task.service";

export async function deleteTask(taskId: string, orgId: string) {
  if (!orgId) throw new Error("No active organization");

  const ctx = await requireOrgContext({ organizationId: orgId });
  await deleteTaskService(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId,
  });

  return true;
}
