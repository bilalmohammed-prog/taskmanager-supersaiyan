import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Tables, TablesInsert, UUID } from "@/lib/types/database";

export type AssignmentWithDetails = {
  id: UUID;
  task_title: string;
  employee_name: string | null;
  allocated_hours: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string | null;
};

type AssignmentQueryRow = {
  id: UUID;
  allocated_hours: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string | null;
  tasks: {
    id: UUID;
    title: string;
    organization_id?: UUID;
  } | null;
  resources: {
    id: UUID;
    name: string;
  } | null;
};

export async function assignUserToTask(
  userId: UUID,
  taskId: UUID,
  allocatedHours: number,
  startTime: string,
  endTime: string,
  orgId: UUID
): Promise<Tables<"assignments">> {
  // Verify task exists in organization
  const { data: task, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (taskError) {
    throw new Error(taskError.message);
  }

  if (!task) {
    throw new Error("Task not found in this organization");
  }

  // Verify user exists
  const { data: user, error: userError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("User not found");
  }

  const insert: TablesInsert<"assignments"> = {
    resource_id: userId,
    task_id: taskId,
    allocated_hours: allocatedHours,
    start_time: startTime,
    end_time: endTime,
  };

  const { data, error } = await supabaseAdmin
    .from("assignments")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create assignment");
  }

  return data;
}

export async function getTaskAssignments(taskId: UUID): Promise<AssignmentWithDetails[]> {
  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select(
      `
      id,
      allocated_hours,
      start_time,
      end_time,
      created_at,
      tasks!inner (
        id,
        title
      ),
      resources!inner (
        id,
        name
      )
    `
    )
    .eq("task_id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: AssignmentQueryRow) => ({
    id: row.id,
    task_title: row.tasks?.title ?? "",
    employee_name: row.resources?.name ?? null,
    allocated_hours: row.allocated_hours,
    start_time: row.start_time,
    end_time: row.end_time,
    created_at: row.created_at,
  }));
}

export async function getUserAssignments(userId: UUID): Promise<AssignmentWithDetails[]> {
  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select(
      `
      id,
      allocated_hours,
      start_time,
      end_time,
      created_at,
      tasks!inner (
        id,
        title
      ),
      resources!inner (
        id,
        name
      )
    `
    )
    .eq("resource_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: AssignmentQueryRow) => ({
    id: row.id,
    task_title: row.tasks?.title ?? "",
    employee_name: row.resources?.name ?? null,
    allocated_hours: row.allocated_hours,
    start_time: row.start_time,
    end_time: row.end_time,
    created_at: row.created_at,
  }));
}

export async function getOrganizationAssignments(orgId: UUID): Promise<AssignmentWithDetails[]> {
  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select(
      `
      id,
      allocated_hours,
      start_time,
      end_time,
      created_at,
      tasks!inner (
        id,
        title,
        organization_id
      ),
      resources!inner (
        id,
        name
      )
    `
    )
    .eq("tasks.organization_id", orgId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: AssignmentQueryRow) => ({
    id: row.id,
    task_title: row.tasks?.title ?? "",
    employee_name: row.resources?.name ?? null,
    allocated_hours: row.allocated_hours,
    start_time: row.start_time,
    end_time: row.end_time,
    created_at: row.created_at,
  }));
}
