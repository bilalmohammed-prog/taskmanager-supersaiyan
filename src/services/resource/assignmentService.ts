import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type AssignmentListRow = {
  id: string;
  user_id: string;
  task_id: string;
  allocated_hours: number | null;
  created_at: string | null;
  start_time: string | null;
  end_time: string | null;
  profile: { id: string; name: string } | null;
  task: { id: string; title: string; status: string | null } | null;
};

function notImplemented(): never {
  // TODO: Re-enable assignmentService.ts after assignment model migration is complete.
  throw new Error("Not implemented");
}

export async function listAssignments(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string }
): Promise<AssignmentListRow[]> {
  return notImplemented();
}

export async function createAssignment(
  _supabase: SupabaseClient<Database>,
  _params: {
    organizationId: string;
    userId: string;
    taskId: string;
    allocatedHours?: number;
  }
): Promise<AssignmentListRow> {
  return notImplemented();
}

export async function updateAssignment(
  _supabase: SupabaseClient<Database>,
  _params: {
    organizationId: string;
    assignmentId: string;
    updates: Partial<AssignmentListRow>;
  }
): Promise<AssignmentListRow> {
  return notImplemented();
}

export async function deleteAssignment(
  _supabase: SupabaseClient<Database>,
  _params: { organizationId: string; assignmentId: string }
): Promise<void> {
  return notImplemented();
}
