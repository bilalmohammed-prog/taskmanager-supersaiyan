"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listOrganizationMembers } from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";
import { uuidSchema } from "@/lib/validation/common";

export async function listOrgMembers(
  orgId: string
): Promise<ActionResult<Array<{ user_id: string; name: string }>>> {
  try {
    const validatedOrgId = uuidSchema.parse(orgId);

    const ctx = await requireOrgContext({ organizationId: validatedOrgId });
    const members = await listOrganizationMembers(ctx.supabase, {
      organizationId: ctx.organizationId,
    });
    const data = members.map((m) => ({ user_id: m.userId, name: m.fullName }));
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
