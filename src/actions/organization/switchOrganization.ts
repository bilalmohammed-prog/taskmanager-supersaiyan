"use server";

import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { UUID, Tables } from "@/lib/types/database";
import { switchActiveOrganization } from "@/services/organization/organization.service";

type ActionError = { message: string };
export type ActionResult<T> = { data: T; error: null } | { data: null; error: ActionError };

function isUUID(value: unknown): value is UUID {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

export async function switchOrganization(
  orgId: unknown
): Promise<ActionResult<Tables<"profiles">>> {
  try {
    if (!isUUID(orgId)) {
      return { data: null, error: { message: "Invalid organization id." } };
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: { message: "Not authenticated." } };
    }

    const profile = await switchActiveOrganization(supabase, user.id as UUID, orgId);

    // Keep server session aligned with selection.
    const cookieStore = await cookies();
    cookieStore.set("activeOrg", orgId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return { data: profile, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
