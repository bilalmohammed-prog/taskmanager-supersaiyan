"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { updateTask as updateTaskService } from "@/services/task/task.service";
import type { TablesUpdate,Tables } from "@/lib/types/database";

export async function updateTask(
  taskId: string,
  updates: TablesUpdate<"tasks">,
  orgId: string
): Promise<Tables<"tasks">> {
  if (!orgId) throw new Error("No active organization");

  const ctx = await requireOrgContext({ organizationId: orgId });

  const safeUpdates: {
    title?: string;
    description?: string | null;
    due_date?: string | null;
    status?: "todo" | "in_progress" | "blocked" | "done";
  } = {};

  if (updates.title !== undefined) safeUpdates.title = updates.title ?? undefined;
  if (updates.description !== undefined) safeUpdates.description = updates.description;
  if (updates.due_date !== undefined) safeUpdates.due_date = updates.due_date;
  if (updates.status !== undefined)
    safeUpdates.status = updates.status as "todo" | "in_progress" | "blocked" | "done";

  return updateTaskService(ctx.supabase, {
    organizationId: orgId,
    taskId,
    updates: safeUpdates,
  });
}