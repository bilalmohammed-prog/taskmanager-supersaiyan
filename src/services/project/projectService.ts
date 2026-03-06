import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";

type ProjectMemberWithResource = {
  project_id: string;
  resource_id: string;
  left_at: string | null;
  resources: {
    id: string;
    name: string;
    organization_id: string;
  } | null;
};

async function assertProjectInOrg(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
) {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.projectId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Project not found");
}

export async function createProject(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    name: string;
    status?: TablesInsert<"projects">["status"];
    startDate?: string | null;
    endDate?: string | null;
  }
): Promise<Tables<"projects">> {
  const insert: TablesInsert<"projects"> = {
    organization_id: params.organizationId,
    name: params.name,
    status: params.status ?? "active",
    start_date: params.startDate ?? null,
    end_date: params.endDate ?? null,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(insert)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create project");
  return data;
}

export async function updateProject(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    projectId: string;
    name?: string;
    status?: TablesUpdate<"projects">["status"];
    startDate?: string | null;
    endDate?: string | null;
  }
): Promise<Tables<"projects">> {
  await assertProjectInOrg(supabase, {
    organizationId: params.organizationId,
    projectId: params.projectId,
  });

  const update: TablesUpdate<"projects"> = {};
  if (params.name !== undefined) update.name = params.name;
  if (params.status !== undefined) update.status = params.status;
  if (params.startDate !== undefined) update.start_date = params.startDate;
  if (params.endDate !== undefined) update.end_date = params.endDate;

  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", params.projectId)
    .eq("organization_id", params.organizationId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update project");
  return data;
}

export async function listProjects(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<Tables<"projects">[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function softDeleteProject(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<void> {
  await assertProjectInOrg(supabase, params);

  const now = new Date().toISOString();

  const { error: projectError } = await supabase
    .from("projects")
    .update({ deleted_at: now })
    .eq("id", params.projectId)
    .eq("organization_id", params.organizationId);

  if (projectError) throw new Error(projectError.message);

  const { error: taskError } = await supabase
    .from("tasks")
    .update({ deleted_at: now })
    .eq("project_id", params.projectId)
    .eq("organization_id", params.organizationId);

  if (taskError) throw new Error(taskError.message);
}

export async function listProjectMembers(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<Array<{ resource_id: string; name: string }>> {
  await assertProjectInOrg(supabase, params);

  const { data, error } = await supabase
    // NOTE: this table is not present in generated types in this repo; we keep it untyped.
    .from("project_members")
    .select(
      `
      resource_id,
      resources!inner (
        id,
        name,
        organization_id
      )
    `
    )
    .eq("project_id", params.projectId)
    .is("left_at", null)
    .eq("resources.organization_id", params.organizationId);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ProjectMemberWithResource[];
  return rows.map((m) => ({
    resource_id: m.resource_id,
    name: m.resources?.name ?? "",
  }));
}

export async function assignProjectMember(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string; userId: string }
): Promise<void> {
  await assertProjectInOrg(supabase, params);

  // Ensure target user is a member of the org.
  const { data: member, error: memberError } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (memberError) throw new Error(memberError.message);
  if (!member) throw new Error("User is not a member of this organization");

  // Ensure a matching human resource exists for this user.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", params.userId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);

  const { data: existingResource, error: resourceError } = await supabase
    .from("resources")
    .select("id")
    .eq("id", params.userId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (resourceError) throw new Error(resourceError.message);

  if (!existingResource) {
    const { error: createError } = await supabase.from("resources").insert({
      id: params.userId,
      organization_id: params.organizationId,
      name: profile?.full_name ?? "Unknown",
      type: "human",
    });

    if (createError) throw new Error(createError.message);
  } else {
    // Keep name in sync, but keep the operation tenant-scoped.
    const { error: syncError } = await supabase
      .from("resources")
      .update({ name: profile?.full_name ?? "Unknown" })
      .eq("id", params.userId)
      .eq("organization_id", params.organizationId);
    if (syncError) throw new Error(syncError.message);
  }

  const { error } = await supabase
    .from("project_members")
    .upsert(
      {
        project_id: params.projectId,
        resource_id: params.userId,
        left_at: null,
      } satisfies TablesInsert<"project_members">,
      { onConflict: "project_id,resource_id" }
    );

  if (error) throw new Error(error.message);
}

export async function removeProjectMember(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string; resourceId: string }
): Promise<void> {
  await assertProjectInOrg(supabase, params);

  const { error } = await supabase
    .from("project_members")
    .update({ left_at: new Date().toISOString() } satisfies TablesUpdate<"project_members">)
    .eq("project_id", params.projectId)
    .eq("resource_id", params.resourceId);

  if (error) throw new Error(error.message);

  // Remove assignments for tasks in this project (tenant-scoped).
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id")
    .eq("project_id", params.projectId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null);

  if (tasksError) throw new Error(tasksError.message);
  const taskIds = (tasks ?? []).map((t) => t.id);
  if (taskIds.length === 0) return;

  const { error: assignmentError } = await supabase
    .from("resource_assignments")
    .delete()
    .eq("resource_id", params.resourceId)
    .in("task_id", taskIds);

  if (assignmentError) throw new Error(assignmentError.message);
}

