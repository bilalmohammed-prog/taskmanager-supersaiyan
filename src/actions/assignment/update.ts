"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { updateAssignment as updateAssignmentService } from "@/services/resource/assignment.service";
import type { TablesUpdate } from "@/lib/types/database";

export async function updateAssignment(
  assignmentId: string,
  updates: TablesUpdate<"assignments">
) {
  const ctx = await requireOrgContext();
  return await updateAssignmentService(ctx.supabase, {
    organizationId: ctx.organizationId,
    assignmentId,
    updates,
  });
}
