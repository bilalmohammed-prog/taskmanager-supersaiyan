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

function notImplemented(): never {
  // TODO: Re-enable analytics service after resource-oriented modules are migrated.
  throw new Error("Not implemented");
}

export async function getTeamWorkload(_orgId: UUID): Promise<TeamMemberWorkload[]> {
  return notImplemented();
}

export async function getProjectProgress(_projectId: UUID): Promise<ProjectProgressMetrics> {
  return notImplemented();
}

export async function getTaskCompletionRate(_orgId: UUID): Promise<TaskCompletionMetrics> {
  return notImplemented();
}