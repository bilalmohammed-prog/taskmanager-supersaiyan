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

export async function addComment(
  taskId: UUID,
  userId: UUID,
  content: string,
  orgId: UUID
): Promise<Tables<"comments">> {
  // Derive tenant from the authenticated user's profile.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id,active_organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile?.active_organization_id) {
    throw new Error("Active organization not found");
  }

  if (orgId && orgId !== profile.active_organization_id) {
    throw new Error("Organization mismatch");
  }

  const organizationId = profile.active_organization_id;

  // Verify task exists in organization
  const { data: task, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (taskError) {
    throw new Error(taskError.message);
  }

  if (!task) {
    throw new Error("Task not found in this organization");
  }

  const insert: TablesInsert<"comments"> = {
    task_id: taskId,
    user_id: userId,
    content,
    organization_id: organizationId,
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
      created_at,
      profiles:created_by (
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

  type Row = {
    id: UUID;
    content: string;
    created_at: string | null;
    profiles:
      | { id: UUID; full_name: string | null; avatar_url: string | null }
      | Array<{ id: UUID; full_name: string | null; avatar_url: string | null }>
      | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
    id: row.id,
    content: row.content,
    author_id: profile?.id ?? "",
    author_name: profile?.full_name ?? null,
    author_avatar: profile?.avatar_url ?? null,
    created_at: row.created_at,
    };
  });
}
