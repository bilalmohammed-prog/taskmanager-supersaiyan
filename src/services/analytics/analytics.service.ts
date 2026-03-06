import { supabaseAdmin } from "@/lib/supabase/admin";
import type { UUID } from "@/lib/types/database";

export type TeamMemberWorkload = {
  employee_id: UUID;
  employee_name: string | null;
  total_allocated_hours: number;
};

export type ProjectProgressMetrics = {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  blocked_tasks: number;
  completion_rate: number;
};

export type TaskCompletionMetrics = {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
};

type AssignmentWithProfiles = {
  resource_id: UUID;
  allocated_hours: number | null;
  resources: {
    id: UUID;
    name: string;
  } | null;
};

export async function getTeamWorkload(orgId: UUID): Promise<TeamMemberWorkload[]> {
  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select(
      `
      resource_id,
      allocated_hours,
      resources!inner (
        id,
        name,
        organization_id
      )
    `
    )
    .eq("resources.organization_id", orgId);

  if (error) {
    throw new Error(error.message);
  }

  // Group by resource and sum allocated hours
  const workloadMap = new Map<UUID, { name: string | null; hours: number }>();

  (data ?? []).forEach((row: AssignmentWithProfiles) => {
    const resourceId = row.resource_id;
    const hours = row.allocated_hours ?? 0;
    const name = row.resources?.name ?? null;

    if (workloadMap.has(resourceId)) {
      const existing = workloadMap.get(resourceId)!;
      existing.hours += hours;
    } else {
      workloadMap.set(resourceId, { name, hours });
    }
  });

  return Array.from(workloadMap.entries()).map(([employeeId, data]) => ({
    employee_id: employeeId,
    employee_name: data.name,
    total_allocated_hours: Math.round(data.hours * 10) / 10, // round to 1 decimal
  }));
}

export async function getProjectProgress(
  projectId: UUID
): Promise<ProjectProgressMetrics> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("status")
    .eq("project_id", projectId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const tasks = data ?? [];
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;

  return {
    total_tasks: total,
    completed_tasks: completed,
    in_progress_tasks: inProgress,
    todo_tasks: todo,
    blocked_tasks: blocked,
    completion_rate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export async function getTaskCompletionRate(
  orgId: UUID
): Promise<TaskCompletionMetrics> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("status")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const tasks = data ?? [];
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;

  return {
    total_tasks: total,
    completed_tasks: completed,
    completion_rate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
