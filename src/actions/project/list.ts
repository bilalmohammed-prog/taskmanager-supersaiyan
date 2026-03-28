"use server";

import { listProjectsFromDb } from "@/lib/api";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

export async function listProjectsAction() {
  const ctx = await requireOrgContext();
  return await listProjectsFromDb(ctx.supabase, ctx.organizationId);
}
