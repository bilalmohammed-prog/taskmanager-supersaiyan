import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type TenantRole = Database["public"]["Enums"]["role_type"];

export type TenantContext = {
  user: User;
  userId: string;
  organizationId: string;
  role: TenantRole;
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
  const cookieStore = await cookies();
  return cookieStore.get("activeOrg")?.value;
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
    role: membership.role,
  };
}

