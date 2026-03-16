"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { listWorkforceProfiles } from "@/services/resource/resource.service";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

type ActionError = { message: string };
export type ActionResult<T> = { data: T; error: null } | { data: null; error: ActionError };

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

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

