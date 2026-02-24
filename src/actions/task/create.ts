"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";
import { cookies } from "next/headers";

export async function createTask(
  title: string,
  description: string | undefined,
  dueDate: string | null,
  orgId: string,
  project_id: string | null
)

{
  const supabase = await getSupabaseServer();
  const cookieStore = await cookies();

  if (!orgId) throw new Error("No active organization");

  const taskInsert: TablesInsert<"tasks"> = {
  title,
  description,
  organization_id: orgId,
  status: "todo",
  due_date: dueDate,
  project_id: project_id ?? null
};


  const { data, error } = await supabase
    .from("tasks")
    .insert(taskInsert)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
