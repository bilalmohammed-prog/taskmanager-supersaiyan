"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/types/database";

export async function createComment(taskId: string, content: string) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile?.active_organization_id) throw new Error("Active organization not found");

  const comment: TablesInsert<"comments"> = {
    task_id: taskId,
    content,
    organization_id: profile.active_organization_id,
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
