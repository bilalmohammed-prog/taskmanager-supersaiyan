"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { createAssignment, deleteAssignment, listAssignments } from "@/services/resource/assignment.service";
import { getTaskById } from "@/services/task/task.service";
import { uuidSchema } from "@/lib/validation/common";

export async function assignTaskToResource(
  taskId: string,
  userId: string | null
) {
  const validatedTaskId = uuidSchema.parse(taskId);
  const validatedUserId = userId ? uuidSchema.parse(userId) : null;

  const ctx = await requireOrgContext();
  authorize("assign", "task", { role: ctx.role });
  const task = await getTaskById(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId: validatedTaskId,
  });
  if (!task) throw new Error("Task not found");

  const existingAssignments = await listAssignments(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId: validatedTaskId,
  });

  await Promise.all(
    existingAssignments.map((assignment) =>
      deleteAssignment(ctx.supabase, {
        organizationId: ctx.organizationId,
        assignmentId: assignment.id,
      })
    )
  );

  if (validatedUserId) {
    await createAssignment(ctx.supabase, {
      organizationId: task.organization_id,
      taskId: validatedTaskId,
      userId: validatedUserId,
    });
  }
}
