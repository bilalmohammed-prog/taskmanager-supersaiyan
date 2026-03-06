import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/types/database";

type AssignmentQueryRow = Tables<"resource_assignments"> & {
  resource: (Pick<Tables<"resources">, "id" | "name" | "type"> & { organization_id: string }) | null;
  task: (Pick<Tables<"tasks">, "id" | "title" | "status"> & { organization_id: string; deleted_at: string | null }) | null;
};

export type AssignmentListRow = Tables<"resource_assignments"> & {
  resource: Pick<Tables<"resources">, "id" | "name" | "type"> | null;
  task: Pick<Tables<"tasks">, "id" | "title" | "status"> | null;
};

async function assertTaskInOrg(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; taskId: string }
) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", params.taskId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Task not found");
}

async function assertResourceInOrg(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; resourceId: string }
) {
  const { data, error } = await supabase
    .from("resources")
    .select("id")
    .eq("id", params.resourceId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Resource not found");
}

export async function listAssignments(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<AssignmentListRow[]> {
  const { data, error } = await supabase
    .from("resource_assignments")
    .select(
      `
      *,
      resource:resources (id, name, type, organization_id),
      task:tasks (id, title, status, organization_id, deleted_at)
    `
    )
    .eq("resource.organization_id", params.organizationId)
    .eq("task.organization_id", params.organizationId)
    .is("task.deleted_at", null);

  if (error) throw new Error(error.message);

  // Strip the organization_id/deleted_at fields we only used for filtering.
  return (data ?? []).map((row: AssignmentQueryRow) => ({
    ...row,
    resource: row.resource
      ? { id: row.resource.id, name: row.resource.name, type: row.resource.type }
      : null,
    task: row.task ? { id: row.task.id, title: row.task.title, status: row.task.status } : null,
  }));
}

export async function createAssignment(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    resourceId: string;
    taskId: string;
    allocatedHours?: number;
  }
): Promise<Tables<"resource_assignments">> {
  await Promise.all([
    assertTaskInOrg(supabase, { organizationId: params.organizationId, taskId: params.taskId }),
    assertResourceInOrg(supabase, { organizationId: params.organizationId, resourceId: params.resourceId }),
  ]);

  const insert: TablesInsert<"resource_assignments"> = {
    resource_id: params.resourceId,
    task_id: params.taskId,
    allocated_hours: params.allocatedHours ?? null,
  };

  const { data, error } = await supabase
    .from("resource_assignments")
    .insert(insert)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create assignment");
  return data;
}

export async function updateAssignment(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    assignmentId: string;
    updates: TablesUpdate<"resource_assignments">;
  }
): Promise<Tables<"resource_assignments">> {
  // Load the row first to scope update to tenant, since resource_assignments has no organization_id.
  const { data: existing, error: fetchError } = await supabase
    .from("resource_assignments")
    .select("id, resource_id, task_id")
    .eq("id", params.assignmentId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Assignment not found");

  await Promise.all([
    assertTaskInOrg(supabase, { organizationId: params.organizationId, taskId: existing.task_id }),
    assertResourceInOrg(supabase, { organizationId: params.organizationId, resourceId: existing.resource_id }),
  ]);

  const { data, error } = await supabase
    .from("resource_assignments")
    .update(params.updates)
    .eq("id", params.assignmentId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update assignment");
  return data;
}

export async function deleteAssignment(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; assignmentId: string }
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("resource_assignments")
    .select("id, resource_id, task_id")
    .eq("id", params.assignmentId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) return;

  await Promise.all([
    assertTaskInOrg(supabase, { organizationId: params.organizationId, taskId: existing.task_id }),
    assertResourceInOrg(supabase, { organizationId: params.organizationId, resourceId: existing.resource_id }),
  ]);

  const { error } = await supabase
    .from("resource_assignments")
    .delete()
    .eq("id", params.assignmentId);

  if (error) throw new Error(error.message);
}

