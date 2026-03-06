import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Tables, UUID } from "@/lib/types/database";

export type ProjectMemberWithProfile = {
  id: UUID;
  full_name: string | null;
  avatar_url: string | null;
  role?: string;
};

type ProjectMemberQueryRow = {
  resource_id: UUID;
  resources: {
    id: UUID;
    name: string;
  } | null;
};

export async function addUserToProject(
  projectId: UUID,
  userId: UUID,
  role: string,
  orgId: UUID
): Promise<void> {
  // Verify project exists in organization
  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (projectError) {
    throw new Error(projectError.message);
  }

  if (!project) {
    throw new Error("Project not found in this organization");
  }

  // Verify user is a member of the organization
  const { data: member, error: memberError } = await supabaseAdmin
    .from("org_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!member) {
    throw new Error("User is not a member of this organization");
  }

  // Add user to project (stored as resource_id in project_members)
  const { error: insertError } = await supabaseAdmin
    .from("project_members")
    .upsert(
      {
        project_id: projectId,
        resource_id: userId,
        left_at: null,
      },
      { onConflict: "project_id,resource_id" }
    );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function removeUserFromProject(
  projectId: UUID,
  userId: UUID
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("project_members")
    .update({ left_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("resource_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getProjectMembers(
  projectId: UUID
): Promise<ProjectMemberWithProfile[]> {
  const { data, error } = await supabaseAdmin
    .from("project_members")
    .select(
      `
      resource_id,
      resources!inner (
        id,
        name
      )
    `
    )
    .eq("project_id", projectId)
    .is("left_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: ProjectMemberQueryRow) => ({
    id: row.resource_id,
    full_name: row.resources?.name ?? null,
    avatar_url: null,
  }));
}
