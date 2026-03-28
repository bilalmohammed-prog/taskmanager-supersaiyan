"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { deleteTask as deleteTaskService } from "@/services/task/task.service";
import { uuidSchema } from "@/lib/validation/common";
import { revalidateTag } from "next/cache";

export async function deleteTask(taskId: string, orgId: string) {
  const validatedTaskId = uuidSchema.parse(taskId);
  const validatedOrgId = uuidSchema.parse(orgId);

  const ctx = await requireOrgContext({ organizationId: validatedOrgId });
  authorize("delete", "task", { role: ctx.role });

  await deleteTaskService(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId: validatedTaskId,
  });

  // ✅ invalidate cache AFTER mutation
  revalidateTag(`analytics-${ctx.organizationId}`, "default");

  return true;
}
