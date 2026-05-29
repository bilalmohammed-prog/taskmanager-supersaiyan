import { NextResponse } from "next/server";
import { fail } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { listAssignments } from "@/services/resource/assignment.service";

export async function GET(req: Request) {
  const routeStart = Date.now();
  try {
    const tenantStart = Date.now();
    const tenant = await requireTenantContext(req);
    console.info(`[perf] [Fetch] api teamProgress requireTenantContext ${Date.now() - tenantStart}ms`);
    authorize("read", "assignment", tenant);
    const { supabase, organizationId } = tenant;

    const queryStart = Date.now();
    const assignments = await listAssignments(supabase, { organizationId });
    console.info(`[perf] [DB] api teamProgress listAssignments ${Date.now() - queryStart}ms`);

    const computeStart = Date.now();
    const statsMap: Record<
      string,
      {
        user_id: string;
        full_name: string;
        total_tasks: number;
        completed_tasks: number;
        total_hours: number;
      }
    > = {};

    assignments.forEach((row) => {
      const task = row.task;

      if (!row.user_id || !task) return;

      if (!statsMap[row.user_id]) {
        statsMap[row.user_id] = {
          user_id: row.user_id,
          full_name: row.profile?.name ?? "Unnamed",
          total_tasks: 0,
          completed_tasks: 0,
          total_hours: 0,
        };
      }

      statsMap[row.user_id].total_tasks += 1;

      if (task.status === "done") {
        statsMap[row.user_id].completed_tasks += 1;
      }

      statsMap[row.user_id].total_hours +=
        typeof row.allocated_hours === "number" && Number.isFinite(row.allocated_hours)
          ? row.allocated_hours
          : 0;
    });
    const computeMs = Date.now() - computeStart;
    if (computeMs > 8) {
      console.info(`[perf] [Compute] api teamProgress stats reduce ${computeMs}ms`);
    }
    console.info(`[perf] [Page] api teamProgress total ${Date.now() - routeStart}ms`);

    return NextResponse.json({ success: true, data: { employees: Object.values(statsMap) } });
  } catch (err) {
    console.info(`[perf] [Page] api teamProgress total ${Date.now() - routeStart}ms`);
    console.error("[MANAGER_PROGRESS_ERROR]", err);
    return fail(err);
  }
}
