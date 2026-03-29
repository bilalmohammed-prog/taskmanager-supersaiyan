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
    <div className="flex w-full max-w-5xl flex-col space-y-8 pb-16">
      <div className="space-y-2">
        <h1 className="text-[2rem] leading-none font-medium tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="max-w-lg text-[15px] text-muted-foreground">
          Track workload, completion, and organization performance at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
