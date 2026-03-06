import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Tables, TablesInsert, UUID } from "@/lib/types/database";

export async function createTask(
  projectId: UUID,
  orgId: UUID,
  title: string,
  description?: string,
  dueDate?: string
): Promise<Tables<"tasks">> {
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

  const insert: TablesInsert<"tasks"> = {
    project_id: projectId,
    organization_id: orgId,
    title,
    description: description ?? null,
    status: "todo",
    due_date: dueDate ?? null,
  };

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create task");
  }

  return data;
}

export async function getTasksByProject(projectId: UUID): Promise<Tables<"tasks">[]> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getTaskById(taskId: UUID): Promise<Tables<"tasks"> | null> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function updateTaskStatus(
  taskId: UUID,
  status: "todo" | "in_progress" | "blocked" | "done"
): Promise<Tables<"tasks">> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update task status");
  }

  return data;
}

export async function deleteTask(taskId: UUID): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("tasks")
    .update({ deleted_at: now })
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }
}
