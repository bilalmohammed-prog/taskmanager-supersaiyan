import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getActiveOrganizationIdFromCookie as getActiveOrgIdFromAuthLib } from "@/lib/auth/tenant-context";
import { normalizeRole, type AppRole, type DatabaseRole } from "@/lib/auth/permissions";

export type TenantRole = AppRole;

export type TenantContext = {
  user: User;
  userId: string;
  organizationId: string;
  role: TenantRole;
  databaseRole: DatabaseRole;
};

export class AuthRequiredError extends Error {
  name = "AuthRequiredError";
}

export class TenantRequiredError extends Error {
  name = "TenantRequiredError";
}

export class ForbiddenTenantAccessError extends Error {
  name = "ForbiddenTenantAccessError";
}

export async function requireUser(
  supabase: SupabaseClient<Database>
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthRequiredError("User not authenticated");
  }

  return user;
}

export async function getActiveOrganizationIdFromCookie(): Promise<
  string | undefined
> {
  return getActiveOrgIdFromAuthLib();
}

export async function requireTenantContext(
  supabase: SupabaseClient<Database>,
  organizationId?: string
): Promise<TenantContext> {
  const user = await requireUser(supabase);

  const resolvedOrgId =
    organizationId ?? (await getActiveOrganizationIdFromCookie());

  if (!resolvedOrgId) {
    throw new TenantRequiredError("No active organization");
  }

  const { data: membership, error } = await supabase
    .from("org_members")
    .select("role")
    .eq("organization_id", resolvedOrgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!membership) {
    throw new ForbiddenTenantAccessError("Not a member of this organization");
  }

  return {
    user,
    userId: user.id,
    organizationId: resolvedOrgId,
    role: normalizeRole(membership.role),
    databaseRole: membership.role,
  };
}
