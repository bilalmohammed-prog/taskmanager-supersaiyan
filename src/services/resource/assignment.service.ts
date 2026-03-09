import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors";

export type AssignmentListRow = {
  id: string;
  user_id: string;
  task_id: string;
  allocated_hours: number | null;
  created_at: string | null;
  start_time: string | null;
  end_time: string | null;
  profile: { id: string; name: string | null } | null;
  task: { id: string; title: string; status: string | null } | null;
};

type AssignmentBaseRow = Database["public"]["Tables"]["assignments"]["Row"];

type AssignmentInsert = Database["public"]["Tables"]["assignments"]["Insert"];

type AssignmentUpdate = Database["public"]["Tables"]["assignments"]["Update"];

async function assertActiveOrganization(
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<void> {
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!organization) {
    throw new ForbiddenError({
      message: "Organization does not exist or is inactive",
    });
  }
}

async function assertActiveTaskInOrganization(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  taskId: string
): Promise<void> {
  const { data: task, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!task) {
    throw new NotFoundError({
      message: "Task not found in your organization",
    });
  }
}

async function assertOrgMember(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string
): Promise<void> {
  const { data: orgMember, error } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!orgMember) {
    throw new ForbiddenError({
      message: "Assignee is not in your organization",
    });
  }
}

async function assertNoDuplicateActiveAssignment(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    taskId: string;
    userId: string;
    excludeAssignmentId?: string;
  }
): Promise<void> {
  let query = supabase
    .from("assignments")
    .select("id")
    .eq("organization_id", params.organizationId)
    .eq("task_id", params.taskId)
    .eq("user_id", params.userId)
    .is("end_time", null)
    .limit(1);

  if (params.excludeAssignmentId) {
    query = query.neq("id", params.excludeAssignmentId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (data) {
    throw new ConflictError({
      message: "Active assignment already exists for this task and user",
    });
  }
}

async function fetchAssignmentsByIds(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    assignmentIds: string[];
  }
): Promise<AssignmentListRow[]> {
  if (params.assignmentIds.length === 0) {
    return [];
  }

  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("id,user_id,task_id,allocated_hours,created_at,start_time,end_time")
    .eq("organization_id", params.organizationId)
    .in("id", params.assignmentIds);

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  return hydrateAssignmentRows(supabase, params.organizationId, assignments ?? []);
}

async function hydrateAssignmentRows(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  assignments: Pick<
    AssignmentBaseRow,
    "id" | "user_id" | "task_id" | "allocated_hours" | "created_at" | "start_time" | "end_time"
  >[]
): Promise<AssignmentListRow[]> {
  const userIds = Array.from(new Set(assignments.map((row) => row.user_id)));
  const taskIds = Array.from(new Set(assignments.map((row) => row.task_id)));

  const [profilesResult, tasksResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profiles").select("id,full_name").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    taskIds.length > 0
      ? supabase
          .from("tasks")
          .select("id,title,status")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .in("id", taskIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) {
    throw new ValidationError({
      message: profilesResult.error.message,
      details: profilesResult.error,
    });
  }

  if (tasksResult.error) {
    throw new ValidationError({
      message: tasksResult.error.message,
      details: tasksResult.error,
    });
  }

  const profileById = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile])
  );
  const taskById = new Map((tasksResult.data ?? []).map((task) => [task.id, task]));

  return assignments.map((row) => {
    const profile = profileById.get(row.user_id);
    const task = taskById.get(row.task_id);

    return {
      id: row.id,
      user_id: row.user_id,
      task_id: row.task_id,
      allocated_hours: row.allocated_hours ?? null,
      created_at: row.created_at ?? null,
      start_time: row.start_time ?? null,
      end_time: row.end_time ?? null,
      profile: profile
        ? {
            id: profile.id,
            name: profile.full_name ?? null,
          }
        : null,
      task: task
        ? {
            id: task.id,
            title: task.title,
            status: task.status ?? null,
          }
        : null,
    };
  });
}

async function getAssignmentOrThrow(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; assignmentId: string }
): Promise<AssignmentBaseRow> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("id", params.assignmentId)
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new NotFoundError({ message: "Assignment not found" });
  }

  return data;
}

export async function listAssignments(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    taskId?: string;
    userId?: string;
    active?: boolean;
  }
): Promise<AssignmentListRow[]> {
  await assertActiveOrganization(supabase, params.organizationId);

  let query = supabase
    .from("assignments")
    .select("id,user_id,task_id,allocated_hours,created_at,start_time,end_time")
    .eq("organization_id", params.organizationId)
    .order("created_at", { ascending: false });

  if (params.taskId) {
    query = query.eq("task_id", params.taskId);
  }

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  }

  if (params.active === true) {
    query = query.is("end_time", null);
  }

  if (params.active === false) {
    query = query.not("end_time", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  return hydrateAssignmentRows(supabase, params.organizationId, data ?? []);
}

export async function createAssignment(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    userId: string;
    taskId: string;
    allocatedHours?: number | null;
    startTime?: string | null;
    endTime?: string | null;
  }
): Promise<AssignmentListRow> {
  await assertActiveOrganization(supabase, params.organizationId);

  await Promise.all([
    assertActiveTaskInOrganization(supabase, params.organizationId, params.taskId),
    assertOrgMember(supabase, params.organizationId, params.userId),
  ]);

  if (!params.endTime) {
    await assertNoDuplicateActiveAssignment(supabase, {
      organizationId: params.organizationId,
      taskId: params.taskId,
      userId: params.userId,
    });
  }

  const insertPayload: AssignmentInsert = {
    organization_id: params.organizationId,
    task_id: params.taskId,
    user_id: params.userId,
    allocated_hours: params.allocatedHours ?? null,
    start_time: params.startTime ?? null,
    end_time: params.endTime ?? null,
  };

  let persisted: AssignmentBaseRow | null = null;

  const { data: upsertData, error: upsertError } = await supabase
    .from("assignments")
    .upsert(insertPayload, {
      onConflict: "organization_id,task_id,user_id",
      ignoreDuplicates: false,
    })
    .select("*")
    .maybeSingle();

  if (upsertError && upsertError.code !== "42P10") {
    if (upsertError.code === "23505") {
      throw new ConflictError({ message: upsertError.message, details: upsertError });
    }
    throw new ValidationError({ message: upsertError.message, details: upsertError });
  }

  if (upsertData) {
    persisted = upsertData;
  }

  if (!persisted) {
    const { data: insertData, error: insertError } = await supabase
      .from("assignments")
      .insert(insertPayload)
      .select("*")
      .maybeSingle();

    if (insertError) {
      if (insertError.code === "23505") {
        throw new ConflictError({ message: insertError.message, details: insertError });
      }
      throw new ValidationError({ message: insertError.message, details: insertError });
    }

    persisted = insertData;
  }

  if (!persisted) {
    throw new ValidationError({ message: "Unable to create assignment" });
  }

  const rows = await fetchAssignmentsByIds(supabase, {
    organizationId: params.organizationId,
    assignmentIds: [persisted.id],
  });

  const created = rows[0];
  if (!created) {
    throw new ValidationError({ message: "Created assignment could not be loaded" });
  }

  return created;
}

export async function updateAssignment(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    assignmentId: string;
    updates: {
      user_id?: string;
      task_id?: string;
      allocated_hours?: number | null;
      start_time?: string | null;
      end_time?: string | null;
    };
  }
): Promise<AssignmentListRow> {
  await assertActiveOrganization(supabase, params.organizationId);

  const current = await getAssignmentOrThrow(supabase, {
    organizationId: params.organizationId,
    assignmentId: params.assignmentId,
  });

  const nextTaskId = params.updates.task_id ?? current.task_id;
  const nextUserId = params.updates.user_id ?? current.user_id;
  const nextStartTime =
    params.updates.start_time !== undefined ? params.updates.start_time : current.start_time;
  const nextEndTime =
    params.updates.end_time !== undefined ? params.updates.end_time : current.end_time;

  if (nextStartTime && nextEndTime && new Date(nextStartTime) > new Date(nextEndTime)) {
    throw new ValidationError({
      message: "start_time must be before or equal to end_time",
    });
  }

  await Promise.all([
    assertActiveTaskInOrganization(supabase, params.organizationId, nextTaskId),
    assertOrgMember(supabase, params.organizationId, nextUserId),
  ]);

  if (!nextEndTime) {
    await assertNoDuplicateActiveAssignment(supabase, {
      organizationId: params.organizationId,
      taskId: nextTaskId,
      userId: nextUserId,
      excludeAssignmentId: params.assignmentId,
    });
  }

  const updatePayload: AssignmentUpdate = {};

  if (params.updates.user_id !== undefined) {
    updatePayload.user_id = params.updates.user_id;
  }

  if (params.updates.task_id !== undefined) {
    updatePayload.task_id = params.updates.task_id;
  }

  if (params.updates.allocated_hours !== undefined) {
    updatePayload.allocated_hours = params.updates.allocated_hours;
  }

  if (params.updates.start_time !== undefined) {
    updatePayload.start_time = params.updates.start_time;
  }

  if (params.updates.end_time !== undefined) {
    updatePayload.end_time = params.updates.end_time;
  }

  const { data, error } = await supabase
    .from("assignments")
    .update(updatePayload)
    .eq("organization_id", params.organizationId)
    .eq("id", params.assignmentId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new ConflictError({ message: error.message, details: error });
    }
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new NotFoundError({ message: "Assignment not found" });
  }

  const rows = await fetchAssignmentsByIds(supabase, {
    organizationId: params.organizationId,
    assignmentIds: [data.id],
  });

  const updated = rows[0];
  if (!updated) {
    throw new ValidationError({ message: "Updated assignment could not be loaded" });
  }

  return updated;
}

export async function deleteAssignment(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; assignmentId: string }
): Promise<void> {
  await assertActiveOrganization(supabase, params.organizationId);

  const { data, error } = await supabase
    .from("assignments")
    .delete()
    .eq("organization_id", params.organizationId)
    .eq("id", params.assignmentId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  if (!data) {
    throw new NotFoundError({ message: "Assignment not found" });
  }
}

