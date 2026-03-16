"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireActionUser } from "@/actions/_helpers/requireOrgContext";
import { createOrganization as createOrganizationSvc } from "@/services/organization/organization.service";
import type { CreateOrganizationResult } from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";

export async function createOrganization(
  name: string,
  slug: string
): Promise<ActionResult<CreateOrganizationResult>> {
  try {
    const supabase = await getSupabaseServer();
    const { user } = await requireActionUser(supabase);
    const data = await createOrganizationSvc(supabase, name, slug, user.id);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
