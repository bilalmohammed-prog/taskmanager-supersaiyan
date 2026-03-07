import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

function notImplemented(): never {
  // TODO: Re-enable task analytics once resource counting is migrated.
  throw new Error("Not implemented");
}

export async function getOrganizationAnalyticsSummary(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string }
): Promise<{
  totalTasks: number;
  completedTasks: number;
  totalEmployees: number;
  totalResources: number;
}> {
  return notImplemented();
}