"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import type { Tables } from "@/lib/types/database";
import { listProjectMembers as listProjectMembersService } from "@/services/resource/projectMember.service";

type ProjectMemberWithProfile = Pick<
  Tables<"project_members">,
  "id" | "user_id" | "role" | "joined_at" | "left_at"
> & {
  full_name: string | null;
  avatar_url: string | null;
};

export async function listProjectMembers(
  projectId: string
): Promise<Array<{ user_id: string; name: string }>> {
  const ctx = await requireOrgContext();
  const members = await listProjectMembersService(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId,
  });
  return members.map((member: ProjectMemberWithProfile) => ({
    user_id: member.user_id,
    name: member.full_name ?? "",
  }));
}
