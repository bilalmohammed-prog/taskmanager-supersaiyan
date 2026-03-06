"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import { requireTenantContext } from "@/services/tenant";
import { listAssignments as listAssignmentsSvc } from "@/services/resource/assignmentService";

export async function listAssignments() {
  const supabase = await getSupabaseServer();
  const ctx = await requireTenantContext(supabase);
  return await listAssignmentsSvc(supabase, {
    organizationId: ctx.organizationId,
  });
}
