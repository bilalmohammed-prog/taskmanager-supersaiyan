import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Tables, TablesInsert, UUID } from "@/lib/types/database";

export type CreateOrganizationResult = {
  organization: Tables<"organizations">;
  member: Tables<"org_members">;
  profile: Tables<"profiles">;
};

export async function createOrganization(
  name: string,
  slug: string,
  userId: UUID
): Promise<CreateOrganizationResult> {
  const orgInsert: TablesInsert<"organizations"> = { name, slug };

  const { data: organization, error: orgError } = await supabaseAdmin
    .from("organizations")
    .insert(orgInsert)
    .select("*")
    .single();

  if (orgError || !organization) {
    throw new Error(orgError?.message ?? "Failed to create organization");
  }

  const memberInsert: TablesInsert<"org_members"> = {
    organization_id: organization.id,
    user_id: userId,
    role: "admin",
  };

  const { data: member, error: memberError } = await supabaseAdmin
    .from("org_members")
    .insert(memberInsert)
    .select("*")
    .single();

  if (memberError || !member) {
    // best-effort rollback
    await supabaseAdmin.from("organizations").delete().eq("id", organization.id);
    throw new Error(memberError?.message ?? "Failed to add org member");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        active_organization_id: organization.id,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (profileError || !profile) {
    // best-effort rollback
    await supabaseAdmin.from("org_members").delete().eq("id", member.id);
    await supabaseAdmin.from("organizations").delete().eq("id", organization.id);
    throw new Error(profileError?.message ?? "Failed to update user profile");
  }

  return { organization, member, profile };
}

export async function getOrganizationById(
  orgId: UUID
): Promise<Tables<"organizations"> | null> {
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getUserOrganizations(
  userId: UUID
): Promise<Array<Pick<Tables<"organizations">, "id" | "name" | "slug">>> {
  const { data, error } = await supabaseAdmin
    .from("org_members")
    .select(
      `
      organization:organizations (
        id,
        name,
        slug
      )
    `
    )
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((d) => d.organization)
    .filter(
      (org): org is Pick<Tables<"organizations">, "id" | "name" | "slug"> =>
        !!org
    );
}

export async function switchActiveOrganization(
  userId: UUID,
  orgId: UUID
): Promise<Tables<"profiles">> {
  // Ensure the user is actually a member of the organization.
  const { data: membership, error: memberError } = await supabaseAdmin
    .from("org_members")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (memberError) throw new Error(memberError.message);
  if (!membership) throw new Error("Forbidden: user is not an org member");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        active_organization_id: orgId,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Failed to switch organization");
  }

  return profile;
}

