import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  UnauthorizedError,
} from "@/lib/api/errors";
import { requireTenantContext, resolveActiveOrganizationId } from "@/lib/auth/tenant-context";
import { normalizeRole, type AppRole, type DatabaseRole } from "@/lib/auth/permissions";
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
  supabase?: SupabaseClient<Database>;
  organizationId?: string | null;
}): Promise<OrgActionContext> {
  const { supabase, user, userId } = await requireActionUser(options?.supabase);
  const organizationId = await resolveActiveOrganizationId(
    supabase,
    userId,
    options?.organizationId
  );

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (sessionError || !token) {
    throw new UnauthorizedError();
  }

  const request = new Request("http://localhost/actions/require-org-context", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const tenant = await requireTenantContext(request, { organizationId });

  return {
    supabase: tenant.supabase,
    user: tenant.user,
    userId: tenant.userId,
    organizationId: tenant.organizationId,
    databaseRole: tenant.databaseRole,
    role: normalizeRole(tenant.databaseRole),
  };
}
