import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export async function getOrganizationAnalyticsSummary(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<{
  totalTasks: number;
  completedTasks: number;
  totalEmployees: number;
  totalResources: number;
}> {
  const [tasks, completed, employees, resources] = await Promise.all([
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", params.organizationId),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", params.organizationId)
      .eq("status", "done"),
    supabase
      .from("org_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", params.organizationId),
    supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null),
  ]);

  if (tasks.error) throw new Error(tasks.error.message);
  if (completed.error) throw new Error(completed.error.message);
  if (employees.error) throw new Error(employees.error.message);
  if (resources.error) throw new Error(resources.error.message);

  return {
    totalTasks: tasks.count ?? 0,
    completedTasks: completed.count ?? 0,
    totalEmployees: employees.count ?? 0,
    totalResources: resources.count ?? 0,
  };
}

