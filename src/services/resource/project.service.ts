import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Tables, TablesInsert, UUID } from "@/lib/types/database";

export async function createProject(
  orgId: UUID,
  name: string,
  startDate?: string,
  endDate?: string
): Promise<Tables<"projects">> {
  const insert: TablesInsert<"projects"> = {
    organization_id: orgId,
    name,
    status: "active",
    start_date: startDate ?? null,
    end_date: endDate ?? null,
  };

  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create project");
  }

  return data;
}

export async function getProjectsByOrganization(
  orgId: UUID
): Promise<Tables<"projects">[]> {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getProjectById(projectId: UUID): Promise<Tables<"projects"> | null> {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function updateProjectStatus(
  projectId: UUID,
  status: "active" | "paused" | "archived"
): Promise<Tables<"projects">> {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update project status");
  }

  return data;
}

export async function softDeleteProject(projectId: UUID): Promise<void> {
  const now = new Date().toISOString();

  const { error: projectError } = await supabaseAdmin
    .from("projects")
    .update({ deleted_at: now })
    .eq("id", projectId);

  if (projectError) {
    throw new Error(projectError.message);
  }

  // Also soft delete all tasks in this project
  const { error: tasksError } = await supabaseAdmin
    .from("tasks")
    .update({ deleted_at: now })
    .eq("project_id", projectId);

  if (tasksError) {
    throw new Error(tasksError.message);
  }
}
