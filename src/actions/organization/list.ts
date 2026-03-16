"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireActionUser } from "@/actions/_helpers/requireOrgContext";
import { listOrganizationsForUser } from "@/services/organization/organization.service";

export async function listUserOrganizations() {
  const supabase = await getSupabaseServer();

  const { user } = await requireActionUser(supabase);
  return await listOrganizationsForUser(supabase, { userId: user.id });
}
