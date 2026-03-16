"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { getTasksByProject } from "@/services/task/task.service";
import {
  deleteAssignment,
  listAssignments,
} from "@/services/resource/assignment.service";
import { removeProjectMember as removeProjectMemberService } from "@/services/resource/projectMember.service";

export async function removeProjectMember(projectId: string, userId: string) {
  const ctx = await requireOrgContext();
  await removeProjectMemberService(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId,
    userId,
  });

  const tasks = await getTasksByProject(ctx.supabase, {
    organizationId: ctx.organizationId,
    projectId,
  });

  for (const task of tasks) {
    const assignments = await listAssignments(ctx.supabase, {
      organizationId: ctx.organizationId,
      taskId: task.id,
      userId,
    });

    for (const assignment of assignments) {
      await deleteAssignment(ctx.supabase, {
        organizationId: ctx.organizationId,
        assignmentId: assignment.id,
      });
    }
  }
}
