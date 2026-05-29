import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/types/database";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/api/errors";

export type ProjectMemberWithProfile = {
  id: string;
  user_id: string;
  role: string | null;
  joined_at: string | null;
  left_at: string | null;
  full_name: string | null;
};

async function assertActiveProjectInOrganization(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  projectId: string
): Promise<void> {
  console.time("[DB] workspace members assert organization+project");
  const [organizationResult, projectResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);
  console.timeEnd("[DB] workspace members assert organization+project");

  const { data: organization, error: organizationError } = organizationResult;
  const { data: project, error: projectError } = projectResult;

  if (organizationError) {
    throw new ValidationError({
      message: organizationError.message,
      details: organizationError,
    });
  }

  if (projectError) {
    throw new ValidationError({
      message: projectError.message,
      details: projectError,
    });
  }

  if (!organization) {
    throw new ForbiddenError({
      message: "Organization does not exist or is inactive",
    });
  }

  if (!project) {
    throw new NotFoundError({
      message: "Project not found in your organization",
    });
  }
}

async function assertOrgMember(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string
): Promise<void> {
  const { data: orgMember, error: orgMemberError } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (orgMemberError) {
    throw new ValidationError({
      message: orgMemberError.message,
      details: orgMemberError,
    });
  }

  if (!orgMember) {
    throw new ForbiddenError({
      message: "User is not a member of this organization",
    });
  }
}

export async function listProjectMembers(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<ProjectMemberWithProfile[]> {
  console.time("[Service] workspace listProjectMembers total");
  await assertActiveProjectInOrganization(supabase, params.organizationId, params.projectId);

  console.time("[DB] workspace members rows");
  const { data: members, error: membersError } = await supabase
    .from("project_members")
    .select("id,user_id,role,joined_at,left_at")
    .eq("organization_id", params.organizationId)
    .eq("project_id", params.projectId)
    .is("left_at", null);
  console.timeEnd("[DB] workspace members rows");

  if (membersError) {
    throw new ValidationError({ message: membersError.message, details: membersError });
  }

  console.time("[Compute] workspace members user ids");
  const userIds = Array.from(new Set((members ?? []).map((member) => member.user_id)));
  console.timeEnd("[Compute] workspace members user ids");

  if (userIds.length === 0) {
    console.timeEnd("[Service] workspace listProjectMembers total");
    return [];
  }

  // POTENTIAL WATERFALL
  // Profiles are fetched after project_members instead of via a joined select.
  console.time("[DB] workspace member profiles");
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", userIds);
  console.timeEnd("[DB] workspace member profiles");

  if (profileError) {
    throw new ValidationError({ message: profileError.message, details: profileError });
  }

  console.time("[Compute] workspace member profile index");
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  console.timeEnd("[Compute] workspace member profile index");

  console.time("[Compute] workspace members merge");
  const rows = (members ?? []).map((member) => {
    const profile = profileById.get(member.user_id);
    return {
      id: member.id,
      user_id: member.user_id,
      role: member.role ?? null,
      joined_at: member.joined_at ?? null,
      left_at: member.left_at ?? null,
      full_name: profile?.full_name ?? null,
    };
  });
  console.timeEnd("[Compute] workspace members merge");
  console.timeEnd("[Service] workspace listProjectMembers total");
  return rows;
}

export async function addProjectMember(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    projectId: string;
    userId: string;
    role?: string;
  }
): Promise<Tables<"project_members">> {
  await assertActiveProjectInOrganization(supabase, params.organizationId, params.projectId);
  await assertOrgMember(supabase, params.organizationId, params.userId);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("project_members")
    .upsert(
      {
        organization_id: params.organizationId,
        project_id: params.projectId,
        user_id: params.userId,
        role: params.role ?? null,
        joined_at: now,
        left_at: null,
      },
      { onConflict: "organization_id,project_id,user_id", ignoreDuplicates: false }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new ValidationError({ message: "Unable to add project member" });
  }

  return data;
}

export async function updateProjectMemberRole(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    projectId: string;
    userId: string;
    role: string;
  }
): Promise<Tables<"project_members">> {
  await assertActiveProjectInOrganization(supabase, params.organizationId, params.projectId);

  const { data, error } = await supabase
    .from("project_members")
    .update({
      role: params.role,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", params.organizationId)
    .eq("project_id", params.projectId)
    .eq("user_id", params.userId)
    .is("left_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new NotFoundError({ message: "Active project membership not found" });
  }

  return data;
}

export async function removeProjectMember(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string; userId: string }
): Promise<void> {
  await assertActiveProjectInOrganization(supabase, params.organizationId, params.projectId);

  const { data, error } = await supabase
    .from("project_members")
    .update({ left_at: new Date().toISOString() })
    .eq("organization_id", params.organizationId)
    .eq("project_id", params.projectId)
    .eq("user_id", params.userId)
    .is("left_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new NotFoundError({ message: "Active project membership not found" });
  }
}
