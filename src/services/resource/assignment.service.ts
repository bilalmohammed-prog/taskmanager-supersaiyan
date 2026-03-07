import type { Tables, UUID } from "@/lib/types/database";

export type AssignmentWithDetails = {
  id: UUID;
  task_title: string;
  employee_name: string | null;
  allocated_hours: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string | null;
};

function notImplemented(): never {
  // TODO: Re-enable assignment.service.ts after resource table dependencies are removed.
  throw new Error("Not implemented");
}

export async function assignUserToTask(
  _userId: UUID,
  _taskId: UUID,
  _allocatedHours: number,
  _startTime: string,
  _endTime: string,
  _orgId: UUID
): Promise<Tables<"assignments">> {
  return notImplemented();
}

export async function getTaskAssignments(_taskId: UUID): Promise<AssignmentWithDetails[]> {
  return notImplemented();
}

export async function getUserAssignments(_userId: UUID): Promise<AssignmentWithDetails[]> {
  return notImplemented();
}

export async function getOrganizationAssignments(_orgId: UUID): Promise<AssignmentWithDetails[]> {
  return notImplemented();
}