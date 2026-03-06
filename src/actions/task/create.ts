"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { Tables, TablesInsert } from "@/lib/types/database";

export async function createTask(
  title: string,
  description: string | undefined,
  dueDate: string | null,
  orgId: string,
  project_id: string | null
): Promise<Tables<"tasks">> {
  const supabase = await getSupabaseServer();

  if (!orgId) throw new Error("No active organization");

  const taskInsert: TablesInsert<"tasks"> = {
    title,
    description,
    organization_id: orgId,
    status: "todo",
    due_date: dueDate,
    project_id: project_id ?? null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(taskInsert)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data;
}
