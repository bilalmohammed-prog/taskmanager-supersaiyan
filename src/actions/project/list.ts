"use server";

import { listProjectsFromDb } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

export async function listProjectsAction() {
  const supabase = await getSupabaseServer();
  const ctx = await requireOrgContext({ supabase });
  return await listProjectsFromDb(supabase, ctx.organizationId);
}
