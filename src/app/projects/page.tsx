import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { createProjectAction } from "@/actions/project/create";
import { listProjectsAction } from "@/actions/project/list";
import { assignProjectMember } from "@/actions/project/assignProjectMember";
import { removeProjectMember } from "@/actions/project/removeProjectMember";
import { listOrgMembers } from "@/actions/organization/listOrgMembers";
import { listProjectMembers } from "@/services/resource/projectMember.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  const ctx = await requireOrgContext();
  const [projects, orgMembersResult] = await Promise.all([
    listProjectsAction(),
    listOrgMembers(ctx.organizationId),
  ]);

  const orgMembers = orgMembersResult.data ?? [];
  const membersByProject = new Map(
    await Promise.all(
      projects.map(async (project) => {
        const members = await listProjectMembers(ctx.supabase, {
          organizationId: ctx.organizationId,
          projectId: project.id,
        });
        return [project.id, members] as const;
      })
    )
  );

  async function createProjectMutation(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    await createProjectAction({ name, status: "active" });
    revalidatePath("/projects");
  }

  async function addProjectMemberMutation(formData: FormData) {
    "use server";
    const projectId = String(formData.get("projectId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    if (!projectId || !userId) return;

    const orgCtx = await requireOrgContext();
    await assignProjectMember(projectId, userId, orgCtx.organizationId);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
  }

  async function removeProjectMemberMutation(formData: FormData) {
    "use server";
    const projectId = String(formData.get("projectId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    if (!projectId || !userId) return;

    await removeProjectMember(projectId, userId);
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
  }

  return (
    <div className="w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Create projects and manage project members.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
          <CardDescription>Creates a new active project in your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProjectMutation} className="flex flex-col gap-3 sm:flex-row">
            <Input name="name" placeholder="Project name" required />
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => {
          const projectMembers = membersByProject.get(project.id) ?? [];
          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.id}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{project.status ?? "active"}</Badge>
                    <Link href={`/projects/${project.id}`} className="text-sm underline">
                      Open
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Members</p>
                  {projectMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members assigned.</p>
                  ) : (
                    <div className="space-y-2">
                      {projectMembers.map((member) => (
                        <form key={member.id} action={removeProjectMemberMutation} className="flex items-center justify-between rounded-md border border-border p-2">
                          <div>
                            <p className="text-sm">{member.full_name ?? member.user_id}</p>
                            <p className="text-xs text-muted-foreground">{member.user_id}</p>
                          </div>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="userId" value={member.user_id} />
                          <Button type="submit" variant="destructive" size="sm">
                            Remove
                          </Button>
                        </form>
                      ))}
                    </div>
                  )}
                </div>

                <form action={addProjectMemberMutation} className="flex flex-col gap-3 sm:flex-row">
                  <input type="hidden" name="projectId" value={project.id} />
                  <select
                    name="userId"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select organization member
                    </option>
                    {orgMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit">Add Member</Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
