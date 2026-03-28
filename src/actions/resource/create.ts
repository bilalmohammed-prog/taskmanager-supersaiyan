"use server";

import { createResourceAssignmentSchema } from "@/lib/validation/resource";
import { createProfileAssignment } from "@/services/resource/resource.service";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { safeErrorMessage, type ActionResult } from "@/actions/organization/_shared";





export async function createResource(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const payload = createResourceAssignmentSchema.parse(input);
    const ctx = await requireOrgContext();
    authorize("update", "assignment", { role: ctx.role });

    const data = await createProfileAssignment(ctx.supabase, {
      organizationId: ctx.organizationId,
      userId: payload.userId,
      taskId: payload.taskId,
      allocatedHours: payload.allocatedHours ?? null,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}

