import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { listAssignments } from "@/services/resource/assignment.service";

export async function GET(req: Request) {
  try {
    const { supabase, organizationId } = await requireTenantContext(req);

    const assignments = await listAssignments(supabase, { organizationId });

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

    return NextResponse.json({ success: true, data: { employees: Object.values(statsMap) } });
  } catch (err) {
    console.error("[MANAGER_PROGRESS_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
