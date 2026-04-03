"use server";

import { cookies } from "next/headers";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { UUID } from "@/lib/types/database";
import { ForbiddenError, ValidationError } from "@/lib/api/errors";
import { uuidSchema } from "@/lib/validation/common";
import { safeErrorMessage } from "./_shared";

export async function switchOrganization(
  orgId: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const validatedOrgId = uuidSchema.parse(orgId) as UUID;
    const ctx = await requireOrgContext();

    const { data: membership, error: membershipError } = await ctx.supabase
      .from("org_members")
      .select("id")
      .eq("organization_id", validatedOrgId)
      .eq("user_id", ctx.userId)
      .maybeSingle();

    if (membershipError) {
      throw new ValidationError({
        message: membershipError.message,
        details: membershipError,
      });
    }

    if (!membership) {
      throw new ForbiddenError({
        message: "You are not a member of the selected organization",
      });
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: ctx.userId,
          active_organization_id: validatedOrgId,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      throw new ValidationError({
        message: profileError.message,
        details: profileError,
      });
    }

    const cookieStore = await cookies();
    cookieStore.set("activeOrg", validatedOrgId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: safeErrorMessage(err) };
  }
}
