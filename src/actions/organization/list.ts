"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireActionUser } from "@/actions/_helpers/requireOrgContext";
import { listOrganizationsForUser } from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";

export async function listUserOrganizations(): Promise<
  ActionResult<Awaited<ReturnType<typeof listOrganizationsForUser>>>
> {
  try {
    const supabase = await getSupabaseServer();
    const { user } = await requireActionUser(supabase);
    const data = await listOrganizationsForUser(supabase, { userId: user.id });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
