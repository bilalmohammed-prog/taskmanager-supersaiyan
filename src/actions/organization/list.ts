"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/services/tenant";
import { listOrganizationsForUser } from "@/services/organization/organizationService";

export async function listUserOrganizations() {
  const supabase = await getSupabaseServer();

  const user = await requireUser(supabase);
  return await listOrganizationsForUser(supabase, { userId: user.id });
}
