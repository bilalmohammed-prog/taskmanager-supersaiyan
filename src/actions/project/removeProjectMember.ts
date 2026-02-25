"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function removeProjectMember(
  projectId: string,
  resourceId: string
) {
  const supabase = await getSupabaseServer();

  // -------------------------------------------------
  // 1️⃣ remove from project
  // -------------------------------------------------
  const { error } = await supabase
    .from("project_members")
    .update({
      left_at: new Date().toISOString()
    })
    .eq("project_id", projectId)
    .eq("resource_id", resourceId);

  if (error) throw new Error(error.message);

  // -------------------------------------------------
  // 2️⃣ remove ALL task assignments for this resource
  // -------------------------------------------------
  const { error: assignmentError } = await supabase
    .from("resource_assignments")
    .delete()
    .eq("resource_id", resourceId);

  if (assignmentError)
    throw new Error(assignmentError.message);
}