import type { UUID } from "@/lib/types/database";

export type ProjectMemberWithProfile = {
  id: UUID;
  full_name: string | null;
  avatar_url: string | null;
  role?: string;
};

function notImplemented(): never {
  // TODO: Re-enable project member service after user-based model migration is complete.
  throw new Error("Not implemented");
}

export async function addUserToProject(
  _projectId: UUID,
  _userId: UUID,
  _role: string,
  _orgId: UUID
): Promise<void> {
  return notImplemented();
}

export async function removeUserFromProject(_projectId: UUID, _userId: UUID): Promise<void> {
  return notImplemented();
}

export async function getProjectMembers(_projectId: UUID): Promise<ProjectMemberWithProfile[]> {
  return notImplemented();
}
