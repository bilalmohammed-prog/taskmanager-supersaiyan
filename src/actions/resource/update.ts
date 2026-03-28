"use server";

import { uuidSchema } from "@/lib/validation/common";
import { updateResourceAssignmentSchema } from "@/lib/validation/resource";
import { getSupabaseServer } from "@/lib/supabase/server";
import { updateProfileAssignment } from "@/services/resource/resource.service";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { authorize } from "@/lib/auth/authorization";
import { safeErrorMessage, type ActionResult } from "@/actions/organization/_shared";



export async function updateResource(
  resourceId: string,
  updates: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const assignmentId = uuidSchema.parse(resourceId);
    const payload = updateResourceAssignmentSchema.parse(updates);
    const supabase = await getSupabaseServer();
    const ctx = await requireOrgContext({ supabase });
    authorize("update", "assignment", { role: ctx.role });

    const data = await updateProfileAssignment(supabase, {
      organizationId: ctx.organizationId,
      assignmentId,
      updates: { allocated_hours: payload.allocatedHours },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}

