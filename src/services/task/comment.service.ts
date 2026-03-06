import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Tables, TablesInsert, UUID } from "@/lib/types/database";

export type CommentWithAuthor = {
  id: UUID;
  content: string;
  author_id: UUID;
  author_name: string | null;
  author_avatar: string | null;
  created_at: string | null;
};

type CommentQueryRow = {
  id: UUID;
  content: string;
  user_id: UUID | null;
  created_at: string | null;
  profiles: {
    id: UUID;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function addComment(
  taskId: UUID,
  userId: UUID,
  content: string,
  orgId: UUID
): Promise<Tables<"comments">> {
  // Verify task exists in organization
  const { data: task, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (taskError) {
    throw new Error(taskError.message);
  }

  if (!task) {
    throw new Error("Task not found in this organization");
  }

  // Verify user exists
  const { data: user, error: userError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("User not found");
  }

  const insert: TablesInsert<"comments"> = {
    task_id: taskId,
    user_id: userId,
    content,
  };

  const { data, error } = await supabaseAdmin
    .from("comments")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add comment");
  }

  return data;
}

export async function getTaskComments(taskId: UUID): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .select(
      `
      id,
      content,
      user_id,
      created_at,
      profiles!inner (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: CommentQueryRow) => ({
    id: row.id,
    content: row.content,
    author_id: row.user_id ?? "",
    author_name: row.profiles?.full_name ?? null,
    author_avatar: row.profiles?.avatar_url ?? null,
    created_at: row.created_at,
  }));
}
