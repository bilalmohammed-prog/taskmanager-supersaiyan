import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/types/database";

export async function createTask(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    title: string;
    description?: string;
    dueDate: string | null;
    projectId: string | null;
  }
): Promise<Tables<"tasks">> {
  if (params.projectId) {
    const { data: project, error } = await supabase
      .from("projects")
      .select("id")
      .eq("id", params.projectId)
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");
  }

  const insert: TablesInsert<"tasks"> = {
    title: params.title,
    description: params.description,
    organization_id: params.organizationId,
    status: "todo",
    due_date: params.dueDate,
    project_id: params.projectId ?? null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(insert)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create task");
  return data;
}

export async function updateTask(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; taskId: string; updates: TablesUpdate<"tasks"> }
): Promise<Tables<"tasks">> {
  const { data, error } = await supabase
    .from("tasks")
    .update(params.updates)
    .eq("id", params.taskId)
    .eq("organization_id", params.organizationId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update task");
  return data;
}

export async function softDeleteTask(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; taskId: string }
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.taskId)
    .eq("organization_id", params.organizationId);

  if (error) throw new Error(error.message);
}

type TaskWithAssignmentsQueryRow = Tables<"tasks"> & {
  resource_assignments: Array<{
    resource_id: string;
    resources: Pick<Tables<"resources">, "id" | "name" | "organization_id"> | null;
  }> | null;
};

export type TaskWithAssignee = Tables<"tasks"> & {
  assignee_id: string | null;
  assignee_name: string | null;
};

export async function listTasksByProject(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<TaskWithAssignee[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      resource_assignments (
        resource_id,
        resources (
          id,
          name,
          organization_id
        )
      )
    `
    )
    .eq("project_id", params.projectId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as TaskWithAssignmentsQueryRow[];
  return rows.map((task) => {
    const assignment = task.resource_assignments?.[0]; // Take first assignment if any
    const resource = assignment?.resources;
    return {
      ...(task as Tables<"tasks">),
      assignee_id: assignment?.resource_id ?? null,
      assignee_name: resource?.organization_id === params.organizationId ? resource?.name ?? null : null,
    };
  });
}

export async function listTasksForResource(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; resourceId: string }
) {
  // Ensure the resource belongs to the org to avoid leaking cross-tenant assignments.
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("id")
    .eq("id", params.resourceId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (resourceError) throw new Error(resourceError.message);
  if (!resource) throw new Error("Resource not found");

  const { data, error } = await supabase
    .from("resource_assignments")
    .select(
      `
      allocated_hours,
      start_time,
      end_time,
      tasks!inner (
        id,
        title,
        status,
        due_date,
        deleted_at,
        organization_id
      )
    `
    )
    .eq("resource_id", params.resourceId)
    .eq("tasks.organization_id", params.organizationId)
    .is("tasks.deleted_at", null);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setTaskAssignee(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; taskId: string; resourceId: string | null }
): Promise<void> {
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", params.taskId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (taskError) throw new Error(taskError.message);
  if (!task) throw new Error("Task not found");

  if (params.resourceId) {
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id")
      .eq("id", params.resourceId)
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null)
      .maybeSingle();
    if (resourceError) throw new Error(resourceError.message);
    if (!resource) throw new Error("Resource not found");
  }

  if (!params.resourceId) {
    const { error } = await supabase
      .from("resource_assignments")
      .delete()
      .eq("task_id", params.taskId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from("resource_assignments")
    .upsert(
      {
        task_id: params.taskId,
        resource_id: params.resourceId,
      },
      { onConflict: "task_id" }
    );

  if (error) throw new Error(error.message);
}

