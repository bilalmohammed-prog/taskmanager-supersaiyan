"use server";

import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import type { Tables, UUID } from "@/lib/types/database";
import { switchActiveOrganization } from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";
import { uuidSchema } from "@/lib/validation/common";

export async function switchOrganization(
  orgId: unknown
): Promise<ActionResult<Tables<"profiles">>> {
  try {
    const validatedOrgId = uuidSchema.parse(orgId) as UUID;

    const supabase = await getSupabaseServer();
    const ctx = await requireOrgContext({ supabase, organizationId: validatedOrgId });

    const profile = await switchActiveOrganization(supabase, ctx.userId as UUID, validatedOrgId);

    const cookieStore = await cookies();
    cookieStore.set("activeOrg", validatedOrgId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return { data: profile, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}