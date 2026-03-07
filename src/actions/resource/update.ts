"use server";

export async function updateResource(
  resourceId: string,
  updates: Record<string, never>
) {
  void resourceId;
  void updates;
  // TODO: Re-enable update after model migration to profiles/org_members.
  throw new Error("Not implemented");
}
