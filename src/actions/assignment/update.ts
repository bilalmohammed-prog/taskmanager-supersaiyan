"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { updateAssignment as updateAssignmentService } from "@/services/resource/assignment.service";
import { uuidSchema } from "@/lib/validation/common";
import { assignmentUpdateSchema } from "@/lib/validation/assignment";

export async function updateAssignment(
  assignmentId: string,
  updates: {
    allocatedHours?: number | null;
    start_time?: string | null;
    end_time?: string | null;
  }
) {
  const validatedAssignmentId = uuidSchema.parse(assignmentId);
  const validatedUpdates = assignmentUpdateSchema.parse(updates);

  const ctx = await requireOrgContext();
  authorize("update", "assignment", { role: ctx.role });
  return await updateAssignmentService(ctx.supabase, {
    organizationId: ctx.organizationId,
    assignmentId: validatedAssignmentId,
    updates: validatedUpdates,
  });
}
