"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { UUID } from "@/lib/types/database";
import {
  createOrganization as createOrganizationSvc,
  type CreateOrganizationResult,
} from "@/services/organization/organization.service";

type ActionError = { message: string };
export type ActionResult<T> = { data: T; error: null } | { data: null; error: ActionError };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidSlug(slug: string): boolean {
  // simple, production-safe slug rule
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

export async function createOrganization(
  name: unknown,
  slug: unknown
): Promise<ActionResult<CreateOrganizationResult>> {
  try {
    if (!isNonEmptyString(name) || name.trim().length < 2) {
      return { data: null, error: { message: "Organization name is required." } };
    }
    if (!isNonEmptyString(slug) || !isValidSlug(slug.trim())) {
      return {
        data: null,
        error: { message: "Slug must be lowercase and URL-safe (e.g. my-org)." },
      };
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: { message: "Not authenticated." } };
    }

    const result = await createOrganizationSvc(name.trim(), slug.trim(), user.id as UUID);
    return { data: result, error: null };
  } catch (err) {
    // Do not leak internal details beyond the message.
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}

