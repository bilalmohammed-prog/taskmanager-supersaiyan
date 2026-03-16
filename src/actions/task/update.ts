"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { PATCH as patchTaskRoute } from "@/app/api/tasks/[taskId]/route";
import type { TablesUpdate } from "@/lib/types/database";


export async function updateTask(
  taskId: string,
  updates: TablesUpdate<"tasks">,
  orgId: string
) {
  if (!orgId) throw new Error("No active organization");

  const ctx = await requireOrgContext({ organizationId: orgId });
  const {
    data: { session },
    error: sessionError,
  } = await ctx.supabase.auth.getSession();
  const token = session?.access_token;

  if (sessionError || !token) {
    throw new Error("Unauthorized");
  }

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (typeof updates.due_date === "string") payload.dueDate = updates.due_date;
  if (typeof updates.status === "string") payload.status = updates.status;

  const response = await patchTaskRoute(
    new Request(`http://localhost/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
    { params: Promise.resolve({ taskId }) }
  );

  const body = await response.json();
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error?.message ?? body?.error ?? "Failed to update task");
  }

  return body?.data?.task ?? null;
}
