"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { createAssignment as createAssignmentService } from "@/services/resource/assignment.service";

export async function createAssignment(
  userId: string,
  taskId: string,
  allocatedHours?: number
) {
  const ctx = await requireOrgContext();
  return await createAssignmentService(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId,
    taskId,
    allocatedHours: allocatedHours ?? null,
  });
}
