"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import type { Tables } from "@/lib/types/database";
import { listProjectMembers as listProjectMembersService } from "@/services/resource/projectMember.service";
import { uuidSchema } from "@/lib/validation/common";

type ProjectMemberWithProfile = Pick<
  Tables<"project_members">,
  "id" | "user_id" | "role" | "joined_at" | "left_at"
> & {
  full_name: string | null;
};

export async function listProjectMembers(
  projectId: string
): Promise<Array<{ user_id: string; name: string }>> {
  console.time("[Action] workspace listProjectMembers total");
  const validatedProjectId = uuidSchema.parse(projectId);

  console.time("[Action] workspace members requireOrgContext");
  const ctx = await requireOrgContext();
  console.timeEnd("[Action] workspace members requireOrgContext");

  console.time("[DB] workspace members");
  const members = await listProjectMembersService(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
  });
  console.timeEnd("[DB] workspace members");

  console.time("[Compute] workspace members map");
  const mapped = members.map((member: ProjectMemberWithProfile) => ({
    user_id: member.user_id,
    name: member.full_name ?? "",
  }));
  console.timeEnd("[Compute] workspace members map");
  console.timeEnd("[Action] workspace listProjectMembers total");
  return mapped;
}
