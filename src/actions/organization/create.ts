"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/services/tenant";
import { createOrganization as createOrganizationSvc } from "@/services/organization/organizationService";

export async function createOrganization(name: string, slug: string) {
  const supabase = await getSupabaseServer();

  const user = await requireUser(supabase);
  return await createOrganizationSvc(supabase, { userId: user.id, name, slug });
}
