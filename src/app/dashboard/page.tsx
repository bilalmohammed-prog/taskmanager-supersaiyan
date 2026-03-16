import Link from "next/link";
import { getAnalyticsSummary } from "@/actions/analytics/summary";
import { listProjectsAction } from "@/actions/project/list";
import { listAssignments } from "@/actions/assignment/list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const [summary, projects, assignments] = await Promise.all([
    getAnalyticsSummary(),
    listProjectsAction(),
    listAssignments(),
  ]);

  const activeAssignments = assignments.length;

  return (
    <div className="w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Organization overview and task summary.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
            Projects
          </Link>
          <Link href="/settings/org" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
            Org Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle>{summary.totalTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completed Tasks</CardDescription>
            <CardTitle>{summary.completedTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Members</CardDescription>
            <CardTitle>{summary.totalEmployees}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Assignments</CardDescription>
            <CardTitle>{activeAssignments}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Snapshot</CardTitle>
          <CardDescription>Current projects in active organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects found.</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.id}</p>
                </div>
                <Badge variant="secondary">{project.status ?? "active"}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
