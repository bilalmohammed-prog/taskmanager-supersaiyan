"use server";

import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { safeErrorMessage, type ActionResult } from "./_shared";

export async function switchOrganization(
  orgId: string
): Promise<ActionResult<{ switched: true; organizationId: string }>> {
  try {
    const supabase = await getSupabaseServer();
    // Ensure the user is a member of the target org before switching.
    await requireOrgContext({ supabase, organizationId: orgId });

    const cookieStore = await cookies();

    cookieStore.set("activeOrg", orgId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return { data: { switched: true, organizationId: orgId }, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
