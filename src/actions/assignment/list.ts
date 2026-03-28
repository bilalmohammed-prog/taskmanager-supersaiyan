"use server";

import { listAssignmentsFromDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

export async function listAssignments() {
  const ctx = await requireOrgContext();
  return await listAssignmentsFromDb(ctx.supabase, ctx.organizationId);
}
