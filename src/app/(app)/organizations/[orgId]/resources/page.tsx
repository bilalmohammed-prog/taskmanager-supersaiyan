"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { listOrgMembers } from "@/actions/organization/listOrgMembers";
import { useToast } from "@/components/providers/toast";

type WorkforceRow = {
  user_id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  allocatedHours: number;
};

export default function ResourcesPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { addToast } = useToast();
  const [workforce, setWorkforce] = useState<WorkforceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const membersResult = await listOrgMembers(orgId);
        if (membersResult.error || !membersResult.data) {
          addToast("Failed to load workforce", "error");
          return;
        }

        const members = membersResult.data;

        const { data: assignments, error: assignError } = await supabase
          .from("assignments")
          .select(`
            user_id,
            allocated_hours,
            tasks!inner (
              id,
              status,
              deleted_at
            )
          `)
          .eq("organization_id", orgId)
          .is("tasks.deleted_at", null);

        if (assignError) {
          addToast("Failed to load assignments", "error");
          return;
        }

        type AssignmentRow = {
          user_id: string;
          allocated_hours: number | null;
          tasks: { id: string; status: string | null; deleted_at: string | null };
        };

        const rows = (assignments ?? []) as AssignmentRow[];

        const statsMap = new Map<
          string,
          { totalTasks: number; completedTasks: number; allocatedHours: number }
        >();

        for (const row of rows) {
          const existing = statsMap.get(row.user_id) ?? {
            totalTasks: 0,
            completedTasks: 0,
            allocatedHours: 0,
          };

          existing.totalTasks += 1;
          if (row.tasks?.status === "done") existing.completedTasks += 1;
          existing.allocatedHours += row.allocated_hours ?? 0;

          statsMap.set(row.user_id, existing);
        }

        const formatted: WorkforceRow[] = members.map((m) => {
          const stats = statsMap.get(m.user_id) ?? {
            totalTasks: 0,
            completedTasks: 0,
            allocatedHours: 0,
          };
          return {
            user_id: m.user_id,
            name: m.name,
            ...stats,
          };
        });

        setWorkforce(formatted);
      } catch (err) {
        console.error(err);
        addToast("Unexpected error loading workforce", "error");
      } finally {
        setLoading(false);
      }
    }

    if (orgId) load();
  }, [orgId]);

  const getCompletionPct = (completed: number, total: number) =>
    total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="p-6 space-y-6 text-foreground">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Workforce</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Task load and completion across all org members
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading...</p>
      )}

      {!loading && workforce.length === 0 && (
        <p className="text-sm text-muted-foreground">No members found.</p>
      )}

      {!loading && workforce.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workforce.map((member) => {
            const pct = getCompletionPct(member.completedTasks, member.totalTasks);
            const barColor =
              pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-blue-500" : "bg-amber-500";

            return (
              <div
                key={member.user_id}
                className="bg-card border border-border rounded-xl p-5 space-y-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {member.user_id}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold text-foreground">{member.totalTasks}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Done</p>
                    <p className="text-lg font-semibold text-foreground">{member.completedTasks}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Hours</p>
                    <p className="text-lg font-semibold text-foreground">{member.allocatedHours}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Completion</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}