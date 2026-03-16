"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { deleteAssignment as deleteAssignmentService } from "@/services/resource/assignment.service";

export async function deleteAssignment(assignmentId: string) {
  const ctx = await requireOrgContext();
  await deleteAssignmentService(ctx.supabase, {
    organizationId: ctx.organizationId,
    assignmentId,
  });
  return true;
}
