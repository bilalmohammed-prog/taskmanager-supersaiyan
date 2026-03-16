"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/services/tenant";
import { createOrganization as createOrganizationSvc } from "@/services/organization/organization.service";

export async function createOrganization(name: string, slug: string) {
  const supabase = await getSupabaseServer();

  const user = await requireUser(supabase);
  return await createOrganizationSvc(supabase, name, slug, user.id);
}
