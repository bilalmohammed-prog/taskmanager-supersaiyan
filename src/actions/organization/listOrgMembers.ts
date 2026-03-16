"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listOrganizationMembers } from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";

export async function listOrgMembers(
  orgId: string
): Promise<ActionResult<Array<{ user_id: string; name: string }>>> {
  try {
    const supabase = await getSupabaseServer();
    const ctx = await requireOrgContext({ supabase, organizationId: orgId });
    const members = await listOrganizationMembers(supabase, {
      organizationId: ctx.organizationId,
    });
    const data = members.map((m) => ({ user_id: m.userId, name: m.fullName }));
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
