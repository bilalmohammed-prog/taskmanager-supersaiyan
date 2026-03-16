"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import {
  createAssignment,
  deleteAssignment,
  listAssignments,
} from "@/services/resource/assignment.service";
import { getTaskById } from "@/services/task/task.service";

export async function assignTaskToResource(
  taskId: string,
  userId: string | null
) {
  const ctx = await requireOrgContext();
  const task = await getTaskById(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId,
  });
  if (!task) throw new Error("Task not found");

  const existingAssignments = await listAssignments(ctx.supabase, {
    organizationId: ctx.organizationId,
    taskId,
  });

  // UNASSIGN
  if (!userId) {
    await Promise.all(
      existingAssignments.map((assignment) =>
        deleteAssignment(ctx.supabase, {
          organizationId: ctx.organizationId,
          assignmentId: assignment.id,
        })
      )
    );
    return;
  }

  // ASSIGN / REASSIGN
  await Promise.all(
    existingAssignments.map((assignment) =>
      deleteAssignment(ctx.supabase, {
        organizationId: ctx.organizationId,
        assignmentId: assignment.id,
      })
    )
  );

  await createAssignment(ctx.supabase, {
    organizationId: task.organization_id,
    taskId,
    userId,
  });
}
