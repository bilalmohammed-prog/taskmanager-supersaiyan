"use server";

import { revalidateTag } from "next/cache";
import { createProjectInDb } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { projectCreateSchema } from "@/lib/validation/project";


export async function createProjectAction(params: {
  name: string;
  status?: "active" | "paused" | "archived";
  startDate?: string | null;
  endDate?: string | null;
}) {
  const validated = projectCreateSchema.parse(params);

  const supabase = await getSupabaseServer();
  const ctx = await requireOrgContext({ supabase });

  const result = await createProjectInDb(supabase, {
    organizationId: ctx.organizationId,
    ...validated,
  });

  revalidateTag(`analytics-${ctx.organizationId}`,"default");

  return result;
}