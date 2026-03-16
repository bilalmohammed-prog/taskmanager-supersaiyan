"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { createTask as createTaskService } from "@/services/task/task.service";
import type { Tables } from "@/lib/types/database";

export async function createTask(
  title: string,
  description: string | undefined,
  dueDate: string | null,
  orgId: string,
  project_id: string | null
): Promise<Tables<"tasks">> {
  if (!orgId) throw new Error("No active organization");
  if (!project_id) throw new Error("project_id is required");

  const ctx = await requireOrgContext({ organizationId: orgId });
  return await createTaskService(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: project_id,
    title,
    description,
    dueDate: dueDate ?? undefined,
  });
}
