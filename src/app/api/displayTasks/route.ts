import { NextResponse } from "next/server";
import { fail } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { listOrganizationMembers } from "@/services/organization/organization.service";
import { listAssignments } from "@/services/resource/assignment.service";
import { getTaskById } from "@/services/task/task.service";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  deleted_at: string | null;
};

export async function GET(req: Request): Promise<NextResponse> {
  const routeStart = Date.now();
  try {
    const tenantStart = Date.now();
    const tenant = await requireTenantContext(req);
    console.info(`[perf] [Fetch] api displayTasks requireTenantContext ${Date.now() - tenantStart}ms`);
    authorize("read", "task", tenant);
    const { supabase, organizationId } = tenant;

    /* ================= PARAMS ================= */
    const { searchParams } = new URL(req.url);
    const userId =
      searchParams.get("user_id") ?? searchParams.get("employee_id");


    if (!userId) {
      return NextResponse.json({ success: true, data: { tasks: [] } });
    }

    const membersStart = Date.now();
    const members = await listOrganizationMembers(supabase, { organizationId });
    console.info(`[perf] [DB] api displayTasks listOrganizationMembers ${Date.now() - membersStart}ms`);
    const isMember = members.some((member) => member.userId === userId);
    if (!isMember) {
      return NextResponse.json({ success: true, data: { tasks: [] } });
    }

    const assignmentsStart = Date.now();
    const assignments = await listAssignments(supabase, {
      organizationId,
      userId,
    });
    console.info(`[perf] [DB] api displayTasks listAssignments ${Date.now() - assignmentsStart}ms`);

    /* ================= MAP ================= */
    // POTENTIAL WATERFALL
    // [N+1 Risk] Each assignment can trigger a separate task lookup.
    const formatStart = Date.now();
    const formattedTasks = (
      await Promise.all(
        assignments.map(async (assignment) => {
          const task = assignment.task
            ? await getTaskById(supabase, {
                organizationId,
                taskId: assignment.task.id,
              })
            : null;

          if (!task) return null;

          const typedTask: TaskRow = {
            id: task.id,
            title: task.title,
            description: task.description ?? null,
            status: task.status,
            due_date: task.due_date ?? null,
            deleted_at: task.deleted_at ?? null,
          };

          const legacyStatus =
            typedTask.status === "todo"
              ? "pending"
              : typedTask.status === "in_progress"
                ? "in-progress"
                : typedTask.status === "done"
                  ? "completed"
                  : typedTask.status ?? "pending";

          return {
            id: typedTask.id,
            employee_id: assignment.user_id,
            task: typedTask.title ?? "",
            description: typedTask.description ?? "",
            startTime: assignment.start_time,
            endTime: typedTask.due_date,
            status: legacyStatus,
            proof: "",
          };
        })
      )
    ).filter((row): row is NonNullable<typeof row> => Boolean(row));
    console.info(
      `[perf] [N+1 Risk] api displayTasks per-assignment task fetches ${Date.now() - formatStart}ms count=${assignments.length}`
    );
    console.info(`[perf] [Page] api displayTasks total ${Date.now() - routeStart}ms`);

    return NextResponse.json({ success: true, data: { tasks: formattedTasks } });
  } catch (err) {
    console.info(`[perf] [Page] api displayTasks total ${Date.now() - routeStart}ms`);
    console.error("[TASK_ROUTE_EXCEPTION]", err);
    return fail(err);
  }
}
