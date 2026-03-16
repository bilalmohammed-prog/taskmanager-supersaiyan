import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { Database, Tables, TablesInsert } from "@/lib/types/database";

export async function createProject(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    name: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<Tables<"projects">> {
  const insert: TablesInsert<"projects"> = {
    organization_id: params.organizationId,
    name: params.name,
    status: "active",
    start_date: params.startDate ?? null,
    end_date: params.endDate ?? null,
  };

  const { data, error } = await supabase.from("projects").insert(insert).select("*").maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new ValidationError({ message: "Failed to create project" });
  }

  return data;
}

export async function getProjectsByOrganization(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<Tables<"projects">[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  return data ?? [];
}

export async function getProjectById(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<Tables<"projects"> | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("id", params.projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  return data ?? null;
}

export async function updateProjectStatus(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    projectId: string;
    status: "active" | "paused" | "archived";
  }
): Promise<Tables<"projects">> {
  const { data, error } = await supabase
    .from("projects")
    .update({ status: params.status })
    .eq("organization_id", params.organizationId)
    .eq("id", params.projectId)
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

export async function softDeleteProject(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<void> {
  const now = new Date().toISOString();

  const { data, error: projectError } = await supabase
    .from("projects")
    .update({ deleted_at: now })
    .eq("organization_id", params.organizationId)
    .eq("id", params.projectId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (projectError) {
    throw new ValidationError({ message: projectError.message, details: projectError });
  }

  if (!data) {
    throw new NotFoundError({ message: "Project not found in your organization" });
  }

  const { error: tasksError } = await supabase
    .from("tasks")
    .update({ deleted_at: now })
    .eq("organization_id", params.organizationId)
    .eq("project_id", params.projectId)
    .is("deleted_at", null);

  if (tasksError) {
    throw new ValidationError({ message: tasksError.message, details: tasksError });
  }
}
