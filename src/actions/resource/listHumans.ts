"use server";

import { listAssignableProfiles } from "@/services/resource/resource.service";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { safeErrorMessage, type ActionResult } from "@/actions/organization/_shared";

export async function listHumanResources(): Promise<
  ActionResult<Awaited<ReturnType<typeof listAssignableProfiles>>>
> {
  try {
    const tenant = await requireOrgContext();
    const data = await listAssignableProfiles(tenant.supabase, {
      organizationId: tenant.organizationId,
    });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
