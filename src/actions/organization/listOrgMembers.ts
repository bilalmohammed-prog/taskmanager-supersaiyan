"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listOrganizationMembers } from "@/services/organization/organization.service";

export async function listOrgMembers(orgId: string) {
  const supabase = await getSupabaseServer();

  const ctx = await requireOrgContext({ supabase, organizationId: orgId });
  const members = await listOrganizationMembers(supabase, {
    organizationId: ctx.organizationId,
  });
  return members.map((m) => ({ user_id: m.userId, name: m.fullName }));
}
