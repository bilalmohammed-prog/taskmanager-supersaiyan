import type { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/api/errors";
import type { Database, Tables, TablesInsert } from "@/lib/types/database";

export type AddMemberResult = {
  member: Tables<"org_members">;
  created: boolean;
};

export async function addMember(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    userId: string;
    role: Database["public"]["Enums"]["role_type"];
  }
): Promise<AddMemberResult> {
  const { data: existing, error: existingError } = await supabase
    .from("org_members")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existingError) {
    throw new ValidationError({ message: existingError.message, details: existingError });
  }

  if (existing) {
    return { member: existing, created: false };
  }

  const insertPayload: TablesInsert<"org_members"> = {
    organization_id: params.organizationId,
    user_id: params.userId,
    role: params.role,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("org_members")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: afterConflict, error: readAfterConflictError } = await supabase
        .from("org_members")
        .select("*")
        .eq("organization_id", params.organizationId)
        .eq("user_id", params.userId)
        .maybeSingle();

      if (readAfterConflictError) {
        throw new ValidationError({
          message: readAfterConflictError.message,
          details: readAfterConflictError,
        });
      }

      if (afterConflict) {
        return { member: afterConflict, created: false };
      }
    }

    throw new ValidationError({ message: insertError.message, details: insertError });
  }

  if (!inserted) {
    throw new ValidationError({ message: "Unable to add member" });
  }

  return { member: inserted, created: true };
}
