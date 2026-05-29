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
  const routeStart = Date.now();
  try {
    const tenantStart = Date.now();
    const tenant = await requireTenantContext(req);
    console.info(`[perf] [Fetch] api tasks POST requireTenantContext ${Date.now() - tenantStart}ms`);
    const { supabase, organizationId } = tenant;
    authorize("create", "task", tenant);

    const parseStart = Date.now();
    const payload = taskCreateSchema.parse(await req.json());
    console.info(`[perf] [Compute] api tasks POST parse body ${Date.now() - parseStart}ms`);

    const membersStart = Date.now();
    const organizationMembers = await listOrganizationMembers(supabase, {
      organizationId,
    });
    console.info(`[perf] [DB] api tasks POST listOrganizationMembers ${Date.now() - membersStart}ms`);
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

    // POTENTIAL WATERFALL
    const projectStart = Date.now();
    const project = await getProjectById(supabase, {
      organizationId,
      projectId: payload.project_id,
    });
    console.info(`[perf] [DB] api tasks POST getProjectById ${Date.now() - projectStart}ms`);

    if (!project) {
      throw new ForbiddenError({
        message: "Project does not belong to your organization",
      });
    }

    const createStart = Date.now();
    const data = await createTask(supabase, {
      organizationId,
      projectId: project.id,
      createdBy: tenant.user.id,
      title: payload.title,
      description: payload.description ?? undefined,
      dueDate: payload.due_date ?? undefined,
    });
    console.info(`[perf] [DB] api tasks POST createTask ${Date.now() - createStart}ms`);

    const assignmentStart = Date.now();
    await createAssignment(supabase, {
      organizationId,
      taskId: data.id,
      userId: payload.user_id,
    });
    console.info(`[perf] [DB] api tasks POST createAssignment ${Date.now() - assignmentStart}ms`);
    console.info(`[perf] [Page] api tasks POST total ${Date.now() - routeStart}ms`);

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
    console.info(`[perf] [Page] api tasks POST total ${Date.now() - routeStart}ms`);
    console.error("[POST_TASK_EXCEPTION]:", err);
    return fail(err);
  }
}
