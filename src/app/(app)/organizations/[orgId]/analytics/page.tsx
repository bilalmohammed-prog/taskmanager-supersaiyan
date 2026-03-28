import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { getAnalyticsSummaryFromDb } from "@/lib/api";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const tenant = await requireOrgContext({ organizationId: orgId });
  const stats = await getAnalyticsSummaryFromDb(tenant.supabase, tenant.organizationId);

  const completionRate =
    stats.totalTasks === 0
      ? 0
      : Math.round((stats.completedTasks / stats.totalTasks) * 100);

  return (
    <div className="p-6 text-foreground">
      <h1 className="text-xl mb-6">Analytics</h1>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Tasks" value={stats.totalTasks} />
        <StatCard label="Completed Tasks" value={stats.completedTasks} />
        <StatCard label="Employees" value={stats.totalEmployees} />
        <StatCard label="Assignments" value={stats.totalResources} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-card p-4 rounded-lg border border-border">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-2 text-foreground">{value}</p>
    </div>
  );
}
