"use server";

import { createResourceAssignmentSchema } from "@/lib/validation/resource";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createProfileAssignment } from "@/services/resource/resource.service";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

type ActionError = { message: string };
export type ActionResult<T> = { data: T; error: null } | { data: null; error: ActionError };

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

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

