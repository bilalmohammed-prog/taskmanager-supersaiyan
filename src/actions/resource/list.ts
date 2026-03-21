"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { listWorkforceProfiles } from "@/services/resource/resource.service";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { safeErrorMessage, type ActionResult } from "@/actions/organization/_shared";



export async function listResources(): Promise<
  ActionResult<Awaited<ReturnType<typeof listWorkforceProfiles>>>
> {
  try {
    const supabase = await getSupabaseServer();
    const tenant = await requireOrgContext({ supabase });
    const data = await listWorkforceProfiles(supabase, {
      organizationId: tenant.organizationId,
    });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}

