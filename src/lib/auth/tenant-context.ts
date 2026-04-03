import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { UnauthorizedError, ValidationError } from "@/lib/api/errors";
import { normalizeRole, type AppRole, type DatabaseRole } from "./permissions";
import { getSupabaseServer } from "@/lib/supabase/server";

type MembershipRow = {
  organization_id: string;
  role: DatabaseRole;
};

export type TenantContext = {
  supabase: SupabaseClient<Database>;
  user: User;
  userId: string;
  organizationId: string;
  databaseRole: DatabaseRole;
  role: AppRole;
};

export async function getActiveOrganizationIdFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("activeOrg")?.value;
}

async function isUserInOrganization(
  supabase: SupabaseClient<Database>,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("org_members")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  return Boolean(data?.id);
}

async function getFirstMembershipOrganizationId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new ValidationError({ message: membershipError.message, details: membershipError });
  }

  return membership?.organization_id ?? null;
}

export async function resolveActiveOrganizationId(
  supabase: SupabaseClient<Database>,
  userId: string,
  organizationId?: string | null
): Promise<string | null> {
  if (organizationId) {
    return organizationId;
  }

  const cookieOrgId = await getActiveOrganizationIdFromCookie();
  if (cookieOrgId && (await isUserInOrganization(supabase, userId, cookieOrgId))) {
    return cookieOrgId;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new ValidationError({ message: profileError.message, details: profileError });
  }

  if (
    profile?.active_organization_id &&
    (await isUserInOrganization(supabase, userId, profile.active_organization_id))
  ) {
    return profile.active_organization_id;
  }

  const fallbackOrgId = await getFirstMembershipOrganizationId(supabase, userId);
  if (!fallbackOrgId) {
    return null;
  }

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        active_organization_id: fallbackOrgId,
      },
      { onConflict: "id" }
    );

  if (updateProfileError) {
    throw new ValidationError({ message: updateProfileError.message, details: updateProfileError });
  }

  return fallbackOrgId;
}

export async function getTenantContext(
  supabase: SupabaseClient<Database>,
  user: User,
  options?: { organizationId?: string | null }
): Promise<TenantContext> {
  const organizationId = await resolveActiveOrganizationId(
    supabase,
    user.id,
    options?.organizationId
  );

  if (!organizationId) {
    return {
      supabase,
      user,
      userId: user.id,
      organizationId: null,
      databaseRole: null,
      role: null,
    } as unknown as TenantContext;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle<MembershipRow>();

  if (membershipError) {
    throw new ValidationError({ message: membershipError.message, details: membershipError });
  }

  if (!membership) {
    return {
      supabase,
      user,
      userId: user.id,
      organizationId: null,
      databaseRole: null,
      role: null,
    } as unknown as TenantContext;
  }

  return {
    supabase,
    user,
    userId: user.id,
    organizationId,
    databaseRole: membership.role,
    role: normalizeRole(membership.role),
  };
}

export async function requireTenantContext(
  _req: Request,
  options?: { organizationId?: string | null }
): Promise<TenantContext> {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthorizedError();
  }

  return getTenantContext(supabase, user, options);
}
