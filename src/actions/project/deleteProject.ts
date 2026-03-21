"use server";

import { softDeleteProjectInDb } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { uuidSchema } from "@/lib/validation/common";

export async function deleteProject(projectId: string) {
  const validatedProjectId = uuidSchema.parse(projectId);

  const supabase = await getSupabaseServer();
  const ctx = await requireOrgContext({ supabase });
  await softDeleteProjectInDb(supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
  });
}