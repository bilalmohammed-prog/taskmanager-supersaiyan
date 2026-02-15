"use server";

import { getSupabaseServer } from "@/lib/supabase/server"; // adjust path if needed

export async function getAnalyticsSummary(orgId: string) {
  const supabase = await getSupabaseServer();

  // TOTAL TASKS
  const { count: totalTasks, error: taskErr } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (taskErr) console.error("Tasks count error:", taskErr.message);

  // COMPLETED TASKS
  const { count: completedTasks, error: doneErr } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "done");

  if (doneErr) console.error("Completed count error:", doneErr.message);

  // TOTAL EMPLOYEES
  const { count: totalEmployees, error: empErr } = await supabase
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (empErr) console.error("Employee count error:", empErr.message);

  // TOTAL RESOURCES
  const { count: totalResources, error: resErr } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (resErr) console.error("Resource count error:", resErr.message);

  return {
    totalTasks: totalTasks ?? 0,
    completedTasks: completedTasks ?? 0,
    totalEmployees: totalEmployees ?? 0,
    totalResources: totalResources ?? 0,
  };
}
