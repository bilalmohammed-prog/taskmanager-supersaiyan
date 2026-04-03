import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  UnauthorizedError,
} from "@/lib/api/errors";
import { getTenantContext } from "@/lib/auth/tenant-context";
import type { AppRole, DatabaseRole } from "@/lib/auth/permissions";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export type OrgActionContext = {
  supabase: SupabaseClient<Database>;
  user: User;
  userId: string;
  organizationId: string;
  databaseRole: DatabaseRole;
  role: AppRole;
};

export async function requireActionUser(
  supabase?: SupabaseClient<Database>
): Promise<{ supabase: SupabaseClient<Database>; user: User; userId: string }> {
  const client = supabase ?? (await getSupabaseServer());
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  return { supabase: client, user, userId: user.id };
}

export async function requireOrgContext(options?: {
  organizationId?: string | null;
}): Promise<OrgActionContext> {
  const { supabase, user } = await requireActionUser();

  const tenant = await getTenantContext(supabase, user, {
    organizationId: options?.organizationId,
  });

  if (!tenant.organizationId || !tenant.databaseRole || !tenant.role) {
    redirect("/no-organization");
  }

  return {
    supabase: tenant.supabase,
    user: tenant.user,
    userId: tenant.userId,
    organizationId: tenant.organizationId,
    databaseRole: tenant.databaseRole,
    role: tenant.role,
  };
}
