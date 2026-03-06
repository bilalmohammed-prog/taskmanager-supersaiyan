"use server";

import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";

export async function switchOrganization(orgId: string) {
  const supabase = await getSupabaseServer();
  // Ensure the user is a member of the target org before switching.
  await requireTenantContext(supabase, orgId);

  const cookieStore = await cookies();

  cookieStore.set("activeOrg", orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}
