import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";

function notImplemented(): never {
  // TODO: Re-enable project service after resource/project-member model is migrated.
  throw new Error("Not implemented");
}

export async function createProject(
  _supabase: SupabaseClient<Database>,
  _params: {
    organizationId: string;
    name: string;
    status?: TablesInsert<"projects">["status"];
    startDate?: string | null;
    endDate?: string | null;
  }
): Promise<Tables<"projects">> {
  return notImplemented();
}

export async function updateProject(
  _supabase: SupabaseClient<Database>,
  _params: {
    organizationId: string;
    projectId: string;
    name?: string;
    status?: TablesUpdate<"projects">["status"];
    startDate?: string | null;
    endDate?: string | null;
  }
): Promise<Tables<"projects">> {
  return notImplemented();
}

export async function listProjects(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string }
): Promise<Tables<"projects">[]> {
  return notImplemented();
}

export async function softDeleteProject(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; projectId: string }
): Promise<void> {
  return notImplemented();
}

export async function listProjectMembers(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; projectId: string }
): Promise<Array<{ user_id: string; name: string }>> {
  return notImplemented();
}

export async function assignProjectMember(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; projectId: string; userId: string }
): Promise<void> {
  return notImplemented();
}

export async function removeProjectMember(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; projectId: string; userId: string }
): Promise<void> {
  return notImplemented();
}
