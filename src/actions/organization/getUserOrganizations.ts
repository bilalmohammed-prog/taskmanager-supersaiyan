"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { UUID, Tables } from "@/lib/types/database";
import { getUserOrganizations } from "@/services/organization/organization.service";

type ActionError = { message: string };
export type ActionResult<T> = { data: T; error: null } | { data: null; error: ActionError };

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

export type UserOrganization = Pick<Tables<"organizations">, "id" | "name" | "slug">;

export async function getUserOrganizationsAction(): Promise<
  ActionResult<UserOrganization[]>
> {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: { message: "Not authenticated." } };
    }

    const orgs = await getUserOrganizations(supabase, user.id as UUID);
    return { data: orgs, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
