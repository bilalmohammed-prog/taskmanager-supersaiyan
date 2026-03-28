"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { createAssignment as createAssignmentService } from "@/services/resource/assignment.service";
import { uuidSchema } from "@/lib/validation/common";
import { z } from "zod";

const allocatedHoursSchema = z.number().min(0).optional();

export async function createAssignment(
  userId: string,
  taskId: string,
  allocatedHours?: number
) {
  const validatedUserId = uuidSchema.parse(userId);
  const validatedTaskId = uuidSchema.parse(taskId);
  const validatedHours = allocatedHoursSchema.parse(allocatedHours);

  const ctx = await requireOrgContext();
  authorize("update", "assignment", { role: ctx.role });
  return await createAssignmentService(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: validatedUserId,
    taskId: validatedTaskId,
    allocatedHours: validatedHours ?? null,
  });
}
