import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert } from "@/lib/types/database";

export async function listCommentsForTask(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; taskId: string }
): Promise<Tables<"comments">[]> {
  // Validate task belongs to tenant (comments table has no organization_id)
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", params.taskId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (taskError) throw new Error(taskError.message);
  if (!task) throw new Error("Task not found");

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("task_id", params.taskId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCommentForTask(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; userId: string; taskId: string; content: string }
): Promise<Tables<"comments">> {
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", params.taskId)
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (taskError) throw new Error(taskError.message);
  if (!task) throw new Error("Task not found");

  const insert: TablesInsert<"comments"> = {
    task_id: params.taskId,
    content: params.content,
    user_id: params.userId,
  };

  const { data, error } = await supabase
    .from("comments")
    .insert(insert)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create comment");
  return data;
}

