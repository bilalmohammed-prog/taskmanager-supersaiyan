import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { ValidationError } from "@/lib/api/errors";

export async function getOrganizationAnalyticsSummary(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<{
  totalTasks: number;
  completedTasks: number;
  totalEmployees: number;
  totalResources: number;
}> {
  const [tasksResult, completedResult, employeesResult, activeAssignmentsResult] =
    await Promise.all([
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
      supabase
        .from("org_members")
        .select("user_id", { count: "exact", head: true })
        .eq("organization_id", params.organizationId),
      supabase
        .from("assignments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", params.organizationId)
        .is("end_time", null),
    ]);

  if (tasksResult.error) {
    throw new ValidationError({
      message: tasksResult.error.message,
      details: tasksResult.error,
    });
  }
  if (completedResult.error) {
    throw new ValidationError({
      message: completedResult.error.message,
      details: completedResult.error,
    });
  }
  if (employeesResult.error) {
    throw new ValidationError({
      message: employeesResult.error.message,
      details: employeesResult.error,
    });
  }
  if (activeAssignmentsResult.error) {
    throw new ValidationError({
      message: activeAssignmentsResult.error.message,
      details: activeAssignmentsResult.error,
    });
  }

  return {
    totalTasks: tasksResult.count ?? 0,
    completedTasks: completedResult.count ?? 0,
    totalEmployees: employeesResult.count ?? 0,
    totalResources: activeAssignmentsResult.count ?? 0,
  };
}
