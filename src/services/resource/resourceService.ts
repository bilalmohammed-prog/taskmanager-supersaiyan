import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { ForbiddenError, UnauthorizedError, ValidationError } from "@/lib/api/errors";
import {
  createAssignment,
  deleteAssignment,
  updateAssignment,
} from "./assignment.service";

export type ProfileAssignmentRecord = {
  id: string;
  organization_id: string;
  full_name: string | null;
  username: string | null;
  created_at?: string | null;
};

async function requireActorMembership(
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthorizedError();
  }

  const { data: member, error: memberError } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError) {
    throw new ValidationError({ message: memberError.message, details: memberError });
  }

  if (!member) {
    throw new ForbiddenError({ message: "Not a member of this organization" });
  }

  return user.id;
}

export async function listWorkforceProfiles(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<ProfileAssignmentRecord[]> {
  await requireActorMembership(supabase, params.organizationId);

  const { data: members, error: membersError } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("organization_id", params.organizationId);

  if (membersError) {
    throw new ValidationError({ message: membersError.message, details: membersError });
  }

  const userIds = Array.from(new Set((members ?? []).map((member) => member.user_id)));
  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,full_name,username,created_at")
    .in("id", userIds);

  if (profilesError) {
    throw new ValidationError({ message: profilesError.message, details: profilesError });
  }

  return (profiles ?? [])
    .map((profile) => ({
      id: profile.id,
      organization_id: params.organizationId,
      full_name: profile.full_name ?? null,
      username: profile.username ?? null,
      created_at: profile.created_at ?? null,
    }))
    .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
}

export async function listAssignableProfiles(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<ProfileAssignmentRecord[]> {
  return listWorkforceProfiles(supabase, params);
}

export async function createProfileAssignment(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    userId: string;
    taskId: string;
    allocatedHours?: number | null;
  }
): Promise<{ id: string }> {
  await requireActorMembership(supabase, params.organizationId);

  const assignment = await createAssignment(supabase, {
    organizationId: params.organizationId,
    userId: params.userId,
    taskId: params.taskId,
    allocatedHours: params.allocatedHours ?? null,
  });

  return { id: assignment.id };
}

export async function updateProfileAssignment(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    assignmentId: string;
    updates: { allocated_hours?: number | null };
  }
): Promise<{ id: string }> {
  await requireActorMembership(supabase, params.organizationId);

  const assignment = await updateAssignment(supabase, {
    organizationId: params.organizationId,
    assignmentId: params.assignmentId,
    updates: {
      allocated_hours: params.updates.allocated_hours,
    },
  });

  return { id: assignment.id };
}

export async function removeProfileAssignment(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; assignmentId: string }
): Promise<void> {
  await requireActorMembership(supabase, params.organizationId);
  await deleteAssignment(supabase, {
    organizationId: params.organizationId,
    assignmentId: params.assignmentId,
  });
}
