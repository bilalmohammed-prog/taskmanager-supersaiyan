import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type ProfileAssignmentRecord = {
  id: string;
  organization_id: string;
  full_name: string | null;
  username: string | null;
  created_at?: string | null;
};

function notImplemented(): never {
  // TODO: Re-enable workforce service with profiles/assignments-backed queries.
  throw new Error("Not implemented");
}

export async function listWorkforceProfiles(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string }
): Promise<ProfileAssignmentRecord[]> {
  return notImplemented();
}

export async function listAssignableProfiles(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string }
): Promise<ProfileAssignmentRecord[]> {
  return notImplemented();
}

export async function createProfileAssignment(
  _supabase: SupabaseClient<Database>,
  _params: {
    organizationId: string;
    userId: string;
    taskId: string;
    allocatedHours?: number | null;
  }
): Promise<{ id: string }> {
  return notImplemented();
}

export async function updateProfileAssignment(
  _supabase: SupabaseClient<Database>,
  _params: {
    organizationId: string;
    assignmentId: string;
    updates: { allocated_hours?: number | null };
  }
): Promise<{ id: string }> {
  return notImplemented();
}

export async function removeProfileAssignment(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; assignmentId: string }
): Promise<void> {
  return notImplemented();
}
