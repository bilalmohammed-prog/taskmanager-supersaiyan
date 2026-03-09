import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";
import { NotFoundError, ValidationError } from "@/lib/api/errors";

type ProjectStatus = NonNullable<TablesInsert<"projects">["status"]>;

export type ListProjectsParams = {
  organizationId: string;
  page?: number;
  size?: number;
};

export type ListProjectsResult = {
  items: Tables<"projects">[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

export async function createProject(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    name: string;
    status?: ProjectStatus;
    startDate?: string | null;
    endDate?: string | null;
  }
): Promise<Tables<"projects">> {
  const insertPayload: TablesInsert<"projects"> = {
    organization_id: params.organizationId,
    name: params.name,
    status: params.status ?? "active",
    start_date: params.startDate ?? null,
    end_date: params.endDate ?? null,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new ValidationError({
      message: error?.message ?? "Failed to create project",
      details: error,
    });
  }

  return data;
}

export async function updateProject(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    projectId: string;
    name?: string;
    status?: ProjectStatus;
    startDate?: string | null;
    endDate?: string | null;
  }
): Promise<Tables<"projects">> {
  const updates: TablesUpdate<"projects"> = {};

  if (params.name !== undefined) updates.name = params.name;
  if (params.status !== undefined) updates.status = params.status;
  if (params.startDate !== undefined) updates.start_date = params.startDate;
  if (params.endDate !== undefined) updates.end_date = params.endDate;

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", params.projectId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new NotFoundError({ message: "Project not found in your organization" });
  }

  return data;
}

export async function listProjects(
  supabase: SupabaseClient<Database>,
  params: ListProjectsParams
): Promise<ListProjectsResult> {
  const page = params.page ?? 1;
  const size = params.size ?? 20;
  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data, error, count } = await supabase
    .from("projects")
    .select("*", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / size));

  return {
    items: data ?? [],
    page,
    size,
    total,
    totalPages,
  };
}

export async function softDeleteProject(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<void> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("projects")
    .update({ deleted_at: now })
    .eq("id", params.projectId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new NotFoundError({ message: "Project not found in your organization" });
  }
}

export async function listProjectMembers(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<Array<{ user_id: string; name: string }>> {
  const { data: members, error: membersError } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("organization_id", params.organizationId)
    .eq("project_id", params.projectId)
    .is("left_at", null);

  if (membersError) {
    throw new ValidationError({ message: membersError.message, details: membersError });
  }

  const userIds = Array.from(new Set((members ?? []).map((member) => member.user_id)));

  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  if (profileError) {
    throw new ValidationError({ message: profileError.message, details: profileError });
  }

  const fullNameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  return userIds.map((userId) => ({
    user_id: userId,
    name: fullNameById.get(userId) ?? "",
  }));
}

export async function assignProjectMember(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string; userId: string }
): Promise<void> {
  const { error } = await supabase.from("project_members").upsert(
    {
      organization_id: params.organizationId,
      project_id: params.projectId,
      user_id: params.userId,
      left_at: null,
    },
    {
      onConflict: "organization_id,project_id,user_id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }
}

export async function removeProjectMember(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string; userId: string }
): Promise<void> {
  const { error } = await supabase
    .from("project_members")
    .update({ left_at: new Date().toISOString() })
    .eq("organization_id", params.organizationId)
    .eq("project_id", params.projectId)
    .eq("user_id", params.userId)
    .is("left_at", null);

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }
}
