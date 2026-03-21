"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { deleteAssignment as deleteAssignmentService } from "@/services/resource/assignment.service";
import { uuidSchema } from "@/lib/validation/common";

export async function deleteAssignment(assignmentId: string) {
  const validatedAssignmentId = uuidSchema.parse(assignmentId);

  const ctx = await requireOrgContext();
  await deleteAssignmentService(ctx.supabase, {
    organizationId: ctx.organizationId,
    assignmentId: validatedAssignmentId,
  });
  return true;
}