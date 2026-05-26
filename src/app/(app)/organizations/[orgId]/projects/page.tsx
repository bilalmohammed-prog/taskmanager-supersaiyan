import ProjectsClientPage from "./ProjectsClientPage";
import { listProjectsWithMetaAction } from "@/actions/project/listWithMeta";

type ProjectsPageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { orgId } = await params;
  const initialProjects = await listProjectsWithMetaAction({
    organizationId: orgId,
    pageSize: 12,
    pageOffset: 0,
  });

  return <ProjectsClientPage orgId={orgId} initialProjects={initialProjects} />;
}
