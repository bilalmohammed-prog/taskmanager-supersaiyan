import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";

function notImplemented(): never {
  // TODO: Re-enable task service once assignment/resource integration is migrated.
  throw new Error("Not implemented");
}

export async function createTask(
  _supabase: SupabaseClient<Database>,
  _params: {
    organizationId: string;
    title: string;
    description?: string;
    dueDate: string | null;
    projectId: string | null;
  }
): Promise<Tables<"tasks">> {
  return notImplemented();
}

export async function updateTask(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; taskId: string; updates: TablesUpdate<"tasks"> }
): Promise<Tables<"tasks">> {
  return notImplemented();
}

export async function softDeleteTask(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; taskId: string }
): Promise<void> {
  return notImplemented();
}

export type TaskWithAssignee = Tables<"tasks"> & {
  assignee_id: string | null;
  assignee_name: string | null;
};

export async function listTasksByProject(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; projectId: string }
): Promise<TaskWithAssignee[]> {
  return notImplemented();
}

export async function listTasksForResource(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; resourceId: string }
) {
  return notImplemented();
}

export async function setTaskAssignee(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; taskId: string; resourceId: string | null }
): Promise<void> {
  return notImplemented();
}