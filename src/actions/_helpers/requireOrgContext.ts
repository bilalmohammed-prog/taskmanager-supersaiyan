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

let actionContextTraceId = 0;

export async function requireActionUser(
  supabase?: SupabaseClient<Database>
): Promise<{ supabase: SupabaseClient<Database>; user: User; userId: string }> {
  // REPEATED AUTH VALIDATION
  const traceId = ++actionContextTraceId;
  const totalLabel = `[Action] requireActionUser total #${traceId}`;
  const clientLabel = `[Fetch] requireActionUser supabase client #${traceId}`;
  const authLabel = `[DB] auth/session #${traceId}`;
  console.time(totalLabel);
  console.time(clientLabel);
  const client = supabase ?? (await getSupabaseServer());
  console.timeEnd(clientLabel);

  console.time(authLabel);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  console.timeEnd(authLabel);

  if (error || !user) {
    console.timeEnd(totalLabel);
    throw new UnauthorizedError();
  }

  console.timeEnd(totalLabel);
  return { supabase: client, user, userId: user.id };
}

export async function requireOrgContext(options?: {
  organizationId?: string | null;
}): Promise<OrgActionContext> {
  // DUPLICATE CONTEXT LOAD
  // Server actions invoked from the project workspace each rebuild auth/org context independently.
  console.count("[Action] requireOrgContext executions");
  const traceId = ++actionContextTraceId;
  const totalLabel = `[Action] requireOrgContext #${traceId}`;
  const tenantLabel = `[Action] getTenantContext from requireOrgContext #${traceId}`;
  console.time(totalLabel);
  const { supabase, user } = await requireActionUser();

  console.time(tenantLabel);
  const tenant = await getTenantContext(supabase, user, {
    organizationId: options?.organizationId,
  });
  console.timeEnd(tenantLabel);

  if (!tenant.organizationId || !tenant.databaseRole || !tenant.role) {
    console.timeEnd(totalLabel);
    redirect("/no-organization");
  }

  console.timeEnd(totalLabel);
  return {
    supabase: tenant.supabase,
    user: tenant.user,
    userId: tenant.userId,
    organizationId: tenant.organizationId,
    databaseRole: tenant.databaseRole,
    role: tenant.role,
  };
}
