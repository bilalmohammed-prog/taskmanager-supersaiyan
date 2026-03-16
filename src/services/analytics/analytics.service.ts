import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/api/errors";
import type { Database } from "@/lib/types/database";

export type TeamMemberWorkload = {
  employee_id: string;
  employee_name: string | null;
  total_allocated_hours: number;
  assignment_count: number;
  open_tasks_count: number;
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

export async function getTeamWorkload(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<TeamMemberWorkload[]> {
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select("user_id,allocated_hours,task_id,end_time")
    .eq("organization_id", params.organizationId)
    .is("end_time", null);

  if (assignmentsError) {
    throw new ValidationError({
      message: assignmentsError.message,
      details: assignmentsError,
    });
  }

  const { data: openTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id,status")
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .in("status", ["todo", "in_progress", "blocked"]);

  if (tasksError) {
    throw new ValidationError({ message: tasksError.message, details: tasksError });
  }

  const openTaskIds = new Set((openTasks ?? []).map((task) => task.id));
  const userIds = Array.from(new Set((assignments ?? []).map((row) => row.user_id)));

  const { data: profiles, error: profilesError } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id,full_name").in("id", userIds)
      : { data: [], error: null };

  if (profilesError) {
    throw new ValidationError({
      message: profilesError.message,
      details: profilesError,
    });
  }

  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const aggregate = new Map<
    string,
    { totalHours: number; assignmentCount: number; openTaskCount: number }
  >();

  for (const row of assignments ?? []) {
    const current = aggregate.get(row.user_id) ?? {
      totalHours: 0,
      assignmentCount: 0,
      openTaskCount: 0,
    };

    current.totalHours += row.allocated_hours ?? 0;
    current.assignmentCount += 1;
    if (openTaskIds.has(row.task_id)) {
      current.openTaskCount += 1;
    }
    aggregate.set(row.user_id, current);
  }

  return Array.from(aggregate.entries()).map(([userId, totals]) => ({
    employee_id: userId,
    employee_name: nameById.get(userId) ?? null,
    total_allocated_hours: totals.totalHours,
    assignment_count: totals.assignmentCount,
    open_tasks_count: totals.openTaskCount,
  }));
}

export async function getProjectProgress(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; projectId: string }
): Promise<ProjectProgressMetrics> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.projectId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (projectError) {
    throw new ValidationError({ message: projectError.message, details: projectError });
  }

  if (!project) {
    return {
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      todo_tasks: 0,
      blocked_tasks: 0,
      completion_rate: 0,
    };
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("status")
    .eq("organization_id", params.organizationId)
    .eq("project_id", params.projectId)
    .is("deleted_at", null);

  if (tasksError) {
    throw new ValidationError({ message: tasksError.message, details: tasksError });
  }

  const total_tasks = tasks?.length ?? 0;
  const completed_tasks = (tasks ?? []).filter((task) => task.status === "done").length;
  const in_progress_tasks = (tasks ?? []).filter(
    (task) => task.status === "in_progress"
  ).length;
  const todo_tasks = (tasks ?? []).filter((task) => task.status === "todo").length;
  const blocked_tasks = (tasks ?? []).filter((task) => task.status === "blocked").length;

  return {
    total_tasks,
    completed_tasks,
    in_progress_tasks,
    todo_tasks,
    blocked_tasks,
    completion_rate: total_tasks > 0 ? completed_tasks / total_tasks : 0,
  };
}

export async function getTaskCompletionRate(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<TaskCompletionMetrics> {
  const [totalResult, completedResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null)
      .eq("status", "done"),
  ]);

  if (totalResult.error) {
    throw new ValidationError({
      message: totalResult.error.message,
      details: totalResult.error,
    });
  }

  if (completedResult.error) {
    throw new ValidationError({
      message: completedResult.error.message,
      details: completedResult.error,
    });
  }

  const total_tasks = totalResult.count ?? 0;
  const completed_tasks = completedResult.count ?? 0;
  const completion_rate = total_tasks > 0 ? completed_tasks / total_tasks : 0;

  return {
    total_tasks,
    completed_tasks,
    completion_rate,
  };
}
