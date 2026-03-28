"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { deleteAssignment as deleteAssignmentService } from "@/services/resource/assignment.service";
import { uuidSchema } from "@/lib/validation/common";

export async function deleteAssignment(assignmentId: string) {
  const validatedAssignmentId = uuidSchema.parse(assignmentId);

  const ctx = await requireOrgContext();
  authorize("update", "assignment", { role: ctx.role });
  await deleteAssignmentService(ctx.supabase, {
    organizationId: ctx.organizationId,
    assignmentId: validatedAssignmentId,
  });
  return true;
}
