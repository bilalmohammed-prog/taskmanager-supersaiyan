"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireActionUser } from "@/actions/_helpers/requireOrgContext";
import type { UUID, Tables } from "@/lib/types/database";
import { getUserOrganizations } from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";

export type UserOrganization = Pick<Tables<"organizations">, "id" | "name" | "slug">;

export async function getUserOrganizationsAction(): Promise<
  ActionResult<UserOrganization[]>
> {
  try {
    const supabase = await getSupabaseServer();
    const { user } = await requireActionUser(supabase);

    const orgs = await getUserOrganizations(supabase, user.id as UUID);
    return { data: orgs, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
