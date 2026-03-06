"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";
import { listOrganizationMembers } from "@/services/organization/organizationService";

export async function listOrgMembers(orgId: string) {
  const supabase = await getSupabaseServer();

  const ctx = await requireTenantContext(supabase, orgId);
  const members = await listOrganizationMembers(supabase, {
    organizationId: ctx.organizationId,
  });
  return members.map((m) => ({ resource_id: m.userId, name: m.fullName }));
}