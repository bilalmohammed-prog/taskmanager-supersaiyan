import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

type ProgressRow = {
  user_id: string;
  allocated_hours: number | null;
  tasks:
    | {
        id: string;
        status: string | null;
        deleted_at: string | null;
      }
    | {
        id: string;
        status: string | null;
        deleted_at: string | null;
      }[]
    | null;
};

export async function GET(req: Request) {
  try {
    const { supabase, organizationId } = await requireTenantContext(req);

    const { data, error } = await supabase
      .from("assignments")
      .select(
        `
          user_id,
          allocated_hours,
          tasks!inner (
            id,
            status,
            deleted_at
          )
        `
      )
      .eq("organization_id", organizationId)
      .eq("tasks.organization_id", organizationId)
      .is("tasks.deleted_at", null);

    if (error) throw error;

    const userIds = Array.from(
      new Set(((data as ProgressRow[] | null) ?? []).map((row) => row.user_id).filter(Boolean))
    );

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

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

    (data as ProgressRow[] | null)?.forEach((row) => {
      const taskRaw = row.tasks;
      const task = Array.isArray(taskRaw) ? taskRaw[0] : taskRaw;

      if (!row.user_id || !task) return;

      if (!statsMap[row.user_id]) {
        statsMap[row.user_id] = {
          user_id: row.user_id,
          full_name: profileMap.get(row.user_id) ?? "Unnamed",
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
