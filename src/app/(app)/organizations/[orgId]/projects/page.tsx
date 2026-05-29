import ProjectsClientPage from "./ProjectsClientPage";
import { listProjectsWithMetaAction } from "@/actions/project/listWithMeta";

type ProjectsPageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  console.time("[perf] projects page total");
  const { orgId } = await params;
  console.time("[perf] projects listWithMeta");
  const initialProjects = await listProjectsWithMetaAction({
    organizationId: orgId,
    pageSize: 12,
    pageOffset: 0,
  });
  console.timeEnd("[perf] projects listWithMeta");
  console.timeEnd("[perf] projects page total");

  return <ProjectsClientPage orgId={orgId} initialProjects={initialProjects} />;
}
