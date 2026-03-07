"use server";

export async function createResource(
  name: string,
  type: "human" | "equipment" | "room" | "vehicle" | "software"
) {
  void name;
  void type;
  // TODO: Re-enable creation after model migration to profiles/org_members.
  throw new Error("Not implemented");
}
