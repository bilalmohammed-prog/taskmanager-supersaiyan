"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { listAssignableProfiles } from "@/services/resource/resourceService";
import { requireTenantContext } from "@/services/tenant";

type ActionError = { message: string };
export type ActionResult<T> = { data: T; error: null } | { data: null; error: ActionError };

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

export async function listHumanResources(
  orgId: string
): Promise<ActionResult<Awaited<ReturnType<typeof listAssignableProfiles>>>> {
  try {
    void orgId;
    const supabase = await getSupabaseServer();
    const tenant = await requireTenantContext(supabase);
    const data = await listAssignableProfiles(supabase, {
      organizationId: tenant.organizationId,
    });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
