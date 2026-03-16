"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireActionUser } from "@/actions/_helpers/requireOrgContext";
import { createOrganization as createOrganizationSvc } from "@/services/organization/organization.service";

export async function createOrganization(name: string, slug: string) {
  const supabase = await getSupabaseServer();

  const { user } = await requireActionUser(supabase);
  return await createOrganizationSvc(supabase, name, slug, user.id);
}
