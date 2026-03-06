import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert } from "@/lib/types/database";

export async function createOrganization(
  supabase: SupabaseClient<Database>,
  params: { userId: string; name: string; slug: string }
): Promise<Tables<"organizations">> {
  const orgInsert: TablesInsert<"organizations"> = {
    name: params.name,
    slug: params.slug,
  };

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert(orgInsert)
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization");
  }

  const { error: memberError } = await supabase.from("org_members").insert({
    organization_id: org.id,
    user_id: params.userId,
    role: "owner",
  });

  if (memberError) {
    throw new Error(memberError.message);
  }

  return org;
}

export async function listOrganizationsForUser(
  supabase: SupabaseClient<Database>,
  params: { userId: string }
): Promise<Array<Pick<Tables<"organizations">, "id" | "name" | "slug">>> {
  const { data, error } = await supabase
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
    .eq("user_id", params.userId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((d) => d.organization)
    .filter(
      (org): org is Pick<Tables<"organizations">, "id" | "name" | "slug"> =>
        !!org
    );
}

export async function listOrganizationMembers(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<Array<{ userId: string; fullName: string }>> {
  const { data: members, error: memberError } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("organization_id", params.organizationId);

  if (memberError) throw new Error(memberError.message);

  const userIds = members?.map((m) => m.user_id) ?? [];
  if (userIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  if (profileError) throw new Error(profileError.message);

  return (profiles ?? []).map((p) => ({
    userId: p.id,
    fullName: p.full_name ?? "Unknown",
  }));
}

