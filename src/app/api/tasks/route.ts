import {
  ForbiddenError,
} from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { authorize } from "@/lib/auth/authorization";
import { toLegacyTaskStatus } from "@/lib/validation/common";
import { taskCreateSchema } from "@/lib/validation/task";
import { createAssignment } from "@/services/resource/assignment.service";
import { getProjectById } from "@/services/resource/project.service";
import { listOrganizationMembers } from "@/services/organization/organization.service";
import { createTask } from "@/services/task/task.service";

export async function POST(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    const { supabase, organizationId } = tenant;
    authorize("create", "task", tenant);

    const payload = taskCreateSchema.parse(await req.json());

    const organizationMembers = await listOrganizationMembers(supabase, {
      organizationId,
    });
    const assigneeInOrg = organizationMembers.some((member) => member.userId === payload.user_id);
    if (!assigneeInOrg) {
      throw new ForbiddenError({
        message: "Assignee is not in your organization",
      });
    }

    authorize("assign", "task", tenant);

    if (!payload.project_id) {
      throw new ForbiddenError({
        message: "project_id is required",
      });
    }

    const project = await getProjectById(supabase, {
      organizationId,
      projectId: payload.project_id,
    });

    if (!project) {
      throw new ForbiddenError({
        message: "Project does not belong to your organization",
      });
    }

    const data = await createTask(supabase, {
      organizationId,
      projectId: project.id,
      title: payload.title,
      description: payload.description ?? undefined,
      dueDate: payload.due_date ?? undefined,
    });

    await createAssignment(supabase, {
      organizationId,
      taskId: data.id,
      userId: payload.user_id,
    });

    return ok(
      {
        message: "Task created",
        task: {
          employee_id: payload.user_id,
          id: data.id,
          task: data.title,
          description: data.description ?? "",
          startTime: null,
          endTime: data.due_date,
          status: toLegacyTaskStatus(data.status),
          proof: "",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST_TASK_EXCEPTION]:", err);
    return fail(err);
  }
}
