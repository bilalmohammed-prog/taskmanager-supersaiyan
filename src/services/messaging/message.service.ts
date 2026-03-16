import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors";
import type { AppRole } from "@/lib/auth/permissions";
import type { Database, Tables, TablesInsert } from "@/lib/types/database";

export type MessageRow = Tables<"messages">;

async function assertOrgMember(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  userId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("org_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }
  if (!data) {
    throw new ForbiddenError({ message: "User is not a member of this organization" });
  }
}

export async function createMessage(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    senderId: string;
    content: string;
    recipientId?: string | null;
    projectId?: string | null;
  }
): Promise<MessageRow> {
  const content = params.content.trim();
  if (!content) {
    throw new ValidationError({ message: "Message content is required" });
  }

  if (!params.recipientId && !params.projectId) {
    throw new ValidationError({
      message: "Either recipientId or projectId is required",
    });
  }

  if (params.recipientId && params.projectId) {
    throw new ValidationError({
      message: "Provide recipientId or projectId, not both",
    });
  }

  await assertOrgMember(supabase, params.organizationId, params.senderId);

  if (params.recipientId) {
    await assertOrgMember(supabase, params.organizationId, params.recipientId);
  }

  if (params.projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", params.projectId)
      .eq("organization_id", params.organizationId)
      .is("deleted_at", null)
      .maybeSingle();

    if (projectError) {
      throw new ValidationError({ message: projectError.message, details: projectError });
    }

    if (!project) {
      throw new NotFoundError({ message: "Project not found in your organization" });
    }
  }

  const insertPayload: TablesInsert<"messages"> = {
    organization_id: params.organizationId,
    sender_id: params.senderId,
    recipient_id: params.recipientId ?? null,
    project_id: params.projectId ?? null,
    content,
  };

  const { data, error } = await supabase
    .from("messages")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }
  if (!data) {
    throw new ValidationError({ message: "Unable to create message" });
  }

  return data;
}

export async function listMessages(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    userId: string;
    recipientId?: string;
    projectId?: string;
  }
): Promise<MessageRow[]> {
  await assertOrgMember(supabase, params.organizationId, params.userId);

  let query = supabase
    .from("messages")
    .select("*")
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (params.projectId) {
    query = query.eq("project_id", params.projectId);
  } else if (params.recipientId) {
    query = query.or(
      `and(sender_id.eq.${params.userId},recipient_id.eq.${params.recipientId}),and(sender_id.eq.${params.recipientId},recipient_id.eq.${params.userId})`
    );
  } else {
    query = query.or(`sender_id.eq.${params.userId},recipient_id.eq.${params.userId}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }

  return data ?? [];
}

export async function deleteMessage(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    messageId: string;
    actorId: string;
    actorRole: AppRole;
  }
): Promise<void> {
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .select("id,sender_id")
    .eq("organization_id", params.organizationId)
    .eq("id", params.messageId)
    .is("deleted_at", null)
    .maybeSingle();

  if (messageError) {
    throw new ValidationError({ message: messageError.message, details: messageError });
  }

  if (!message) {
    throw new NotFoundError({ message: "Message not found" });
  }

  const canDelete =
    params.actorRole === "owner" ||
    params.actorRole === "admin" ||
    message.sender_id === params.actorId;
  if (!canDelete) {
    throw new ForbiddenError({
      message: "Only owner/admin or message sender can delete this message",
    });
  }

  const { data: updated, error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("organization_id", params.organizationId)
    .eq("id", params.messageId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new ValidationError({ message: error.message, details: error });
  }
  if (!updated) {
    throw new NotFoundError({ message: "Message not found" });
  }
}
