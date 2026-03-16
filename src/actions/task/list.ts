"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listAssignments } from "@/services/resource/assignment.service";

export async function listTasks(employeeId: string) {
  const ctx = await requireOrgContext();
  const rows = await listAssignments(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: employeeId,
  });

  return rows
    .filter((row) => row.task)
    .map((row) => ({
      allocated_hours: row.allocated_hours,
      start_time: row.start_time,
      end_time: row.end_time,
      tasks: row.task
        ? {
            id: row.task.id,
            title: row.task.title,
            status: row.task.status,
            due_date: null,
            deleted_at: null,
          }
        : null,
    }));
}
