"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function deleteProject(projectId: string) {
  const supabase = await getSupabaseServer();
  const now = new Date().toISOString();

  // 1️⃣ soft delete project
  const { error: projectError } = await supabase
    .from("projects")
    .update({ deleted_at: now })
    .eq("id", projectId);

  if (projectError) throw projectError;

  // 2️⃣ soft delete tasks belonging to project
  const { error: taskError } = await supabase
    .from("tasks")
    .update({ deleted_at: now })
    .eq("project_id", projectId);

  if (taskError) throw taskError;
}