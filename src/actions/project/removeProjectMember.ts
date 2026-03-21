"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { getTasksByProject } from "@/services/task/task.service";
import { deleteAssignment, listAssignments } from "@/services/resource/assignment.service";
import { removeProjectMember as removeProjectMemberService } from "@/services/resource/projectMember.service";
import { uuidSchema } from "@/lib/validation/common";

export async function removeProjectMember(projectId: string, userId: string) {
  const validatedProjectId = uuidSchema.parse(projectId);
  const validatedUserId = uuidSchema.parse(userId);

  const ctx = await requireOrgContext();
  await removeProjectMemberService(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
    userId: validatedUserId,
  });

  const tasks = await getTasksByProject(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId: validatedProjectId,
  });

  for (const task of tasks) {
    const assignments = await listAssignments(ctx.supabase, {
      organizationId: ctx.organizationId,
      taskId: task.id,
      userId: validatedUserId,
    });

    for (const assignment of assignments) {
      await deleteAssignment(ctx.supabase, {
        organizationId: ctx.organizationId,
        assignmentId: assignment.id,
      });
    }
  }
}