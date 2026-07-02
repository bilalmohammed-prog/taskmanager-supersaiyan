"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { deleteTask as deleteTaskService } from "@/services/task/task.service";
import { uuidSchema } from "@/lib/validation/common";
import { revalidateTag } from "next/cache";
import { getTaskById } from "@/services/task/task.service";
import { createAuditLog } from "@/services/audit/audit.service";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function deleteTask(taskId: string, orgId: string) {
  const validatedTaskId = uuidSchema.parse(taskId);
  const validatedOrgId = uuidSchema.parse(orgId);

  const ctx = await requireOrgContext({ organizationId: validatedOrgId });
  authorize("delete", "task", { role: ctx.role });
  const task = await getTaskById(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId: validatedTaskId,
  });

  if (!task) {
    throw new Error("Task not found");
  }
  await deleteTaskService(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId: validatedTaskId,
  });
  await createAuditLog(supabaseAdmin, {
    organizationId: ctx.organizationId,
    projectId: task.project_id,
    actorId: ctx.userId,
    action: "DELETE",
    entityType: "task",
    entityId: task.id,
  });

  // ✅ invalidate cache AFTER mutation
  revalidateTag(`analytics-${ctx.organizationId}`, "default");

  return true;
}
