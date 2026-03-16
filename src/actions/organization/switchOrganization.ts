"use server";

import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import type { UUID, Tables } from "@/lib/types/database";
import { switchActiveOrganization } from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";

function isUUID(value: unknown): value is UUID {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export async function switchOrganization(
  orgId: unknown
): Promise<ActionResult<Tables<"profiles">>> {
  try {
    if (!isUUID(orgId)) {
      return { data: null, error: { message: "Invalid organization id." } };
    }

    const supabase = await getSupabaseServer();
    const ctx = await requireOrgContext({ supabase, organizationId: orgId });

    const profile = await switchActiveOrganization(supabase, ctx.userId as UUID, orgId);

    // Keep server session aligned with selection.
    const cookieStore = await cookies();
    cookieStore.set("activeOrg", orgId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return { data: profile, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
