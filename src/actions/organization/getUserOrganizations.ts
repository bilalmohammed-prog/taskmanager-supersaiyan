"use server";

import { requireActionUser } from "@/actions/_helpers/requireOrgContext";
import type { UUID, Tables } from "@/lib/types/database";
import { getUserOrganizations } from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";

export type UserOrganization = Pick<Tables<"organizations">, "id" | "name" | "slug">;

export async function getUserOrganizationsAction(): Promise<
  ActionResult<UserOrganization[]>
> {
  try {
    const { supabase, user } = await requireActionUser();

    const orgs = await getUserOrganizations(supabase, user.id as UUID);
    return { data: orgs, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
