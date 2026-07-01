import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { getAnalyticsSummaryFromDb } from "@/lib/api";
import { getTeamWorkload } from "@/services/analytics/analytics.service";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  console.time("[perf] analytics page total");
  const { orgId } = await params;
  // POTENTIAL WATERFALL
  console.time("[perf] analytics requireOrgContext");
  const tenant = await requireOrgContext({ organizationId: orgId });
  console.timeEnd("[perf] analytics requireOrgContext");

  console.time("[perf] analytics summary db");
  const stats = await getAnalyticsSummaryFromDb(
    tenant.supabase,
    tenant.organizationId
  );
  console.timeEnd("[perf] analytics summary db");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const openTasksPromise = (async () => {
    console.time("[perf] analytics open tasks");
    const result = await tenant.supabase
      .from("tasks")
      .select("id,status,due_date,project_id")
      .eq("organization_id", tenant.organizationId)
      .is("deleted_at", null)
      .in("status", ["todo", "in_progress", "blocked"]);
    console.timeEnd("[perf] analytics open tasks");
    return result;
  })();

  const assignmentsPromise = (async () => {
    console.time("[perf] analytics assignments");
    const result = await tenant.supabase
      .from("assignments")
      .select("task_id,user_id")
      .eq("organization_id", tenant.organizationId)
      .is("end_time", null);
    console.timeEnd("[perf] analytics assignments");
    return result;
  })();

  const projectsPromise = (async () => {
    console.time("[perf] analytics projects");
    const result = await tenant.supabase
      .from("projects")
      .select("id,end_date")
      .eq("organization_id", tenant.organizationId)
      .is("deleted_at", null);
    console.timeEnd("[perf] analytics projects");
    return result;
  })();

  const teamWorkloadPromise = (async () => {
    console.time("[perf] analytics team workload");
    const result = await getTeamWorkload(tenant.supabase, {
      organizationId: tenant.organizationId,
    });
    console.timeEnd("[perf] analytics team workload");
    return result;
  })();

  const [openTasksResult, assignmentsResult, projectsResult, teamWorkload] =
    await Promise.all([
      openTasksPromise,
      assignmentsPromise,
      projectsPromise,
      teamWorkloadPromise,
    ]);

  if (openTasksResult.error) {
    throw new Error(openTasksResult.error.message);
  }
  if (assignmentsResult.error) {
    throw new Error(assignmentsResult.error.message);
  }
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const openTasks = openTasksResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const projects = projectsResult.data ?? [];

  console.time("[perf] analytics compute metrics");
  const todoTasks = openTasks.filter((task) => task.status === "todo").length;
  const inProgressTasks = openTasks.filter(
    (task) => task.status === "in_progress"
  ).length;
  const blockedTasks = openTasks.filter((task) => task.status === "blocked").length;

  const overdueTasks = openTasks.filter((task) => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    return dueDate < todayStart;
  }).length;

  const dueTodayTasks = openTasks.filter((task) => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    return dueDate >= todayStart && dueDate < todayEnd;
  }).length;

  const dueWeekTasks = openTasks.filter((task) => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    return dueDate >= todayStart && dueDate < weekEnd;
  }).length;

  const assignedTaskIds = new Set(assignments.map((row) => row.task_id));
  const assignedUserIds = new Set(assignments.map((row) => row.user_id));

  const unassignedTasks = openTasks.filter((task) => !assignedTaskIds.has(task.id))
    .length;

  const activeProjects = projects.length;
  const projectsNearDeadline = projects.filter((project) => {
    if (!project.end_date) return false;
    const endDate = new Date(project.end_date);
    return endDate >= todayStart && endDate < weekEnd;
  }).length;

  const projectsWithOverdueTasks = new Set(
    openTasks
      .filter((task) => {
        if (!task.due_date || !task.project_id) return false;
        const dueDate = new Date(task.due_date);
        return dueDate < todayStart;
      })
      .map((task) => task.project_id)
  ).size;

  const employeesWithoutAssignments = Math.max(
    stats.totalEmployees - assignedUserIds.size,
    0
  );

  const highestWorkload = [...teamWorkload].sort((a, b) => {
    if (b.open_tasks_count !== a.open_tasks_count) {
      return b.open_tasks_count - a.open_tasks_count;
    }
    return b.assignment_count - a.assignment_count;
  })[0];

  const highestWorkloadCount = highestWorkload?.open_tasks_count ?? 0;
  const highestWorkloadName = highestWorkload?.employee_name || "No active assignments";

  const averageTasksPerEmployee =
    stats.totalEmployees === 0
      ? 0
      : Math.round((openTasks.length / stats.totalEmployees) * 10) / 10;

  const completionRate =
    stats.totalTasks === 0
      ? 0
      : Math.round((stats.completedTasks / stats.totalTasks) * 100);

  console.timeEnd("[perf] analytics compute metrics");

  const completedSummary =
    stats.totalTasks === 0
      ? "No tasks yet"
      : `${stats.completedTasks} of ${stats.totalTasks} tasks completed`;

  const employeeSummary =
    stats.totalEmployees === 0
      ? "No active employees"
      : `${stats.totalEmployees} active employees`;

  const assignmentSummary =

  
    stats.totalResources === 0
      ? "No current assignments"
      : `${stats.totalResources} assignments in play`;

  console.timeEnd("[perf] analytics page total");

  return (
    <div className="flex w-full max-w-10xl flex-col gap-10 pb-16">
      <div className="space-y-2">
        <h1 className="text-[2rem] leading-none font-medium tracking-tight text-foreground">
          Analytics
        </h1>

        <p className="max-w-lg text-[15px] text-muted-foreground">
          Track workload, completion, and organization performance at a glance.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <SectionHeader
            title="KPI Overview"
            description="Core organization health metrics."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PrimaryStatCard
              label="Total Tasks"
              value={stats.totalTasks}
              subtext="All tasks across the organization"
              tone="neutral"
            />
            <PrimaryStatCard
              label="Completion Rate"
              value={`${completionRate}%`}
              subtext={completedSummary}
              tone="success"
            />
            <PrimaryStatCard
              label="Overdue Tasks"
              value={overdueTasks}
              subtext={overdueTasks > 0 ? "Needs attention" : "No overdue tasks"}
              tone="warning"
            />
            <PrimaryStatCard
              label="Completed Tasks"
              value={stats.completedTasks}
              subtext={completedSummary}
              tone="success-strong"
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Urgency & Risk"
            description="Due dates and blockers that need quick attention."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SecondaryStatCard
              label="Due Today"
              value={dueTodayTasks}
              subtext={
                dueTodayTasks > 0 ? "Review today" : "Nothing due today"
              }
              tone="warning"
            />
            <SecondaryStatCard
              label="Due This Week"
              value={dueWeekTasks}
              subtext="Next 7 days"
              tone="info"
            />
            <SecondaryStatCard
              label="Blocked Tasks"
              value={blockedTasks}
              subtext={blockedTasks > 0 ? "Awaiting unblock" : "No blockers"}
              tone="danger"
            />
            <SecondaryStatCard
              label="Unassigned Tasks"
              value={unassignedTasks}
              subtext="Open tasks without owners"
              tone="accent"
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Workload Insights"
            description="Quick signals on employee workload balance."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SecondaryStatCard
              label="Active Employees"
              value={stats.totalEmployees}
              subtext={employeeSummary}
              tone="info"
            />
            <SecondaryStatCard
              label="Employees Without Assignments"
              value={employeesWithoutAssignments}
              subtext={
                employeesWithoutAssignments > 0
                  ? "Consider redistributing work"
                  : "Everyone has tasks"
              }
              tone="neutral"
            />
            <SecondaryStatCard
              label="Highest Workload"
              value={highestWorkloadCount}
              subtext={highestWorkloadName}
              tone="accent"
            />
            <SecondaryStatCard
              label="Avg Tasks per Employee"
              value={averageTasksPerEmployee}
              subtext="Open tasks only"
              tone="neutral"
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Project Health"
            description="Project-level indicators that show delivery risk."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SecondaryStatCard
              label="Active Projects"
              value={activeProjects}
              subtext="Currently running"
              tone="neutral"
            />
            <SecondaryStatCard
              label="Projects Near Deadline"
              value={projectsNearDeadline}
              subtext="Due within 7 days"
              tone="warning"
            />
            <SecondaryStatCard
              label="Projects With Overdue Tasks"
              value={projectsWithOverdueTasks}
              subtext="Requires review"
              tone="danger"
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Status Distribution"
            description="Snapshot of current task pipeline states."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SecondaryStatCard
              label="To Do"
              value={todoTasks}
              subtext="Queued work"
              tone="neutral"
            />
            <SecondaryStatCard
              label="In Progress"
              value={inProgressTasks}
              subtext="Active execution"
              tone="info"
            />
            <SecondaryStatCard
              label="Blocked"
              value={blockedTasks}
              subtext="Needs attention"
              tone="danger"
            />
            <SecondaryStatCard
              label="Completed"
              value={stats.completedTasks}
              subtext="Delivered"
              tone="success-strong"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

type StatTone =
  | "neutral"
  | "success"
  | "success-strong"
  | "info"
  | "accent"
  | "warning"
  | "danger";

const toneStyles: Record<
  StatTone,
  { border: string; bg: string; value: string }
> = {
  neutral: {
    border: "border-border",
    bg: "bg-card",
    value: "text-foreground",
  },

  success: {
    border: "border-emerald-200/70",
    bg: "bg-emerald-50/40",
    value: "text-emerald-700",
  },

  "success-strong": {
    border: "border-emerald-200",
    bg: "bg-emerald-50/70",
    value: "text-emerald-800",
  },

  info: {
    border: "border-sky-200/70",
    bg: "bg-sky-50/40",
    value: "text-sky-700",
  },

  accent: {
    border: "border-indigo-200/70",
    bg: "bg-indigo-50/40",
    value: "text-indigo-700",
  },
  warning: {
    border: "border-amber-200/70",
    bg: "bg-amber-50/50",
    value: "text-amber-700",
  },
  danger: {
    border: "border-rose-200/70",
    bg: "bg-rose-50/50",
    value: "text-rose-700",
  },
};

function StatCard({
  label,
  value,
  subtext,
  tone,
  size,
}: {
  label: string;
  value: number | string;
  subtext?: string | null;
  tone: StatTone;
  size: "primary" | "secondary";
}) {
  const styles = toneStyles[tone];

  const valueSize = size === "primary" ? "text-3xl" : "text-2xl";

  const padding = size === "primary" ? "p-5" : "p-4";

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.bg} ${padding} shadow-sm transition-all duration-200 hover:shadow-md`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`${valueSize} font-semibold leading-none ${styles.value}`}>
          {value}
        </p>
      </div>

      {subtext ? (
        <p className="mt-2 text-xs text-muted-foreground">{subtext}</p>
      ) : null}
    </div>
  );
}

function PrimaryStatCard({
  label,
  value,
  subtext,
  tone,
}: {
  label: string;
  value: number | string;
  subtext?: string | null;
  tone: StatTone;
}) {
  return (
    <StatCard
      label={label}
      value={value}
      subtext={subtext}
      tone={tone}
      size="primary"
    />
  );
}

function SecondaryStatCard({
  label,
  value,
  subtext,
  tone,
}: {
  label: string;
  value: number | string;
  subtext?: string | null;
  tone: StatTone;
}) {
  return (
    <StatCard
      label={label}
      value={value}
      subtext={subtext}
      tone={tone}
      size="secondary"
    />
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
