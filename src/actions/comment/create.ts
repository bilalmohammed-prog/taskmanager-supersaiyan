"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";

export async function createComment(taskId: string, content: string) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const comment: TablesInsert<"comments"> = {
    task_id: taskId,
    content,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("comments")
    .insert(comment)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
