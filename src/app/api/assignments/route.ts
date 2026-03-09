import { fail, ok } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import {
  assignmentCreateBodySchema,
  assignmentListQuerySchema,
} from "@/lib/validation/assignment";
import {
  createAssignment,
  listAssignments,
} from "@/services/resource/assignment.service";

export async function GET(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);

    const url = new URL(req.url);
    const query = assignmentListQuerySchema.parse({
      taskId: url.searchParams.get("taskId") ?? undefined,
      userId: url.searchParams.get("userId") ?? undefined,
      active: url.searchParams.get("active") ?? undefined,
    });

    const assignments = await listAssignments(tenant.supabase, {
      organizationId: tenant.organizationId,
      taskId: query.taskId,
      userId: query.userId,
      active: query.active,
    });

    return ok({ assignments });
  } catch (err) {
    console.error("[GET_ASSIGNMENTS_EXCEPTION]:", err);
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("update", "assignment", tenant);

    const payload = assignmentCreateBodySchema.parse(await req.json());

    const assignment = await createAssignment(tenant.supabase, {
      organizationId: tenant.organizationId,
      taskId: payload.task_id,
      userId: payload.user_id,
      allocatedHours: payload.allocated_hours,
      startTime: payload.start_time,
      endTime: payload.end_time,
    });

    return ok(
      {
        message: "Assignment created",
        assignment,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST_ASSIGNMENT_EXCEPTION]:", err);
    return fail(err);
  }
}
