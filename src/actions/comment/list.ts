"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listComments(taskId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}
