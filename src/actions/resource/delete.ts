"use server";

import { uuidSchema } from "@/lib/validation/common";
import { getSupabaseServer } from "@/lib/supabase/server";
import { removeProfileAssignment } from "@/services/resource/resource.service";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { safeErrorMessage, type ActionResult } from "@/actions/organization/_shared";
type ActionError = { message: string };


export async function deleteResource(resourceId: string): Promise<ActionResult<true>> {
  try {
    const assignmentId = uuidSchema.parse(resourceId);
    const supabase = await getSupabaseServer();
    const tenant = await requireOrgContext({ supabase });

    await removeProfileAssignment(supabase, {
      organizationId: tenant.organizationId,
      assignmentId,
    });

    return { data: true, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}

