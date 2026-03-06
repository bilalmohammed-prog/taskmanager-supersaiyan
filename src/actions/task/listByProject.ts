"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { Tables } from "@/lib/types/database";

type Assignment = {
  resource_id: string;
  resources: {
    name: string;
  } | null;
};

type TaskRow = Tables<"tasks"> & {
  resource_assignments: Assignment[] | null;
};
type TaskWithAssignee = Tables<"tasks"> & {
  assignee_id: string | null;
  assignee_name: string | null;
};
export async function listTasksByProject(
  projectId: string,
  orgId: string
) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      resource_assignments (
        resource_id,
        resources (
          name
        )
      )
    `)
    .eq("project_id", projectId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const mapped: TaskWithAssignee[] = ((data ?? []) as TaskRow[]).map((task) => {
    const assignment = task.resource_assignments?.[0] ?? null;

    return {
      ...task,
      assignee_id: assignment?.resource_id ?? null,
      assignee_name: assignment?.resources?.name ?? null,
    };
  });

  return mapped;
}