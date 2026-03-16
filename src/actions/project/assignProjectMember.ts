"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { addProjectMember } from "@/services/resource/projectMember.service";

export async function assignProjectMember(
  projectId: string,
  userId: string,
  orgId: string
) {
  const ctx = await requireOrgContext({ organizationId: orgId });
  await addProjectMember(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId,
    userId,
  });
}
