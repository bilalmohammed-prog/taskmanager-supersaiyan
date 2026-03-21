"use server";

import { createResourceAssignmentSchema } from "@/lib/validation/resource";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createProfileAssignment } from "@/services/resource/resource.service";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { safeErrorMessage, type ActionResult } from "@/actions/organization/_shared";





export async function createResource(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const payload = createResourceAssignmentSchema.parse(input);
    const supabase = await getSupabaseServer();
    const tenant = await requireOrgContext({ supabase });

    const data = await createProfileAssignment(supabase, {
      organizationId: tenant.organizationId,
      userId: payload.userId,
      taskId: payload.taskId,
      allocatedHours: payload.allocatedHours ?? null,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}

