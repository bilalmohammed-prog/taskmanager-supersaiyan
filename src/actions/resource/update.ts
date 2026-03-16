"use server";

import { uuidSchema } from "@/lib/validation/common";
import { updateResourceAssignmentSchema } from "@/lib/validation/resource";
import { getSupabaseServer } from "@/lib/supabase/server";
import { updateProfileAssignment } from "@/services/resource/resourceService";
import { requireTenantContext } from "@/services/tenant";

type ActionError = { message: string };
export type ActionResult<T> = { data: T; error: null } | { data: null; error: ActionError };

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

export async function updateResource(
  resourceId: string,
  updates: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const assignmentId = uuidSchema.parse(resourceId);
    const payload = updateResourceAssignmentSchema.parse(updates);
    const supabase = await getSupabaseServer();
    const tenant = await requireTenantContext(supabase);

    const data = await updateProfileAssignment(supabase, {
      organizationId: tenant.organizationId,
      assignmentId,
      updates: { allocated_hours: payload.allocatedHours },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
