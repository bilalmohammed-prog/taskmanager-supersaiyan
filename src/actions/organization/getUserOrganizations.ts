"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import type { Tables } from "@/lib/types/database";
import { ValidationError } from "@/lib/api/errors";

export type UserOrganization = Pick<Tables<"organizations">, "id" | "name" | "slug">;

type OrgJoinRow = {
  organization: {
    id: string;
    name: string;
    slug: string;
    deleted_at: string | null;
  } | null;
};

export async function getUserOrganizations(): Promise<UserOrganization[]> {
  const ctx = await requireOrgContext();

  const { data, error } = await ctx.supabase
    .from("org_members")
    .select(
      `
      organization:organizations!org_members_organization_id_fkey (
        id,
        name,
        slug,
        deleted_at
      )
    `
    )
    .eq("user_id", ctx.userId);

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  const rows = (data ?? []) as OrgJoinRow[];

  return rows
    .map((row) => row.organization)
    .filter(
      (org): org is { id: string; name: string; slug: string; deleted_at: string | null } =>
        org !== null && org.deleted_at === null
    )
    .map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
    }));
}

export async function getUserOrganizationsAction(): Promise<{
  data: UserOrganization[] | null;
  error: { message: string } | null;
}> {
  try {
    const orgs = await getUserOrganizations();
    return { data: orgs, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : "Unexpected error" },
    };
  }
}
