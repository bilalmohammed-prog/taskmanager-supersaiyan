"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { UUID } from "@/lib/types/database";
import { requireActionUser } from "@/actions/_helpers/requireOrgContext";
import {
  createOrganization as createOrganizationSvc,
  type CreateOrganizationResult,
} from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidSlug(slug: string): boolean {
  // simple, production-safe slug rule
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
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
    const { user } = await requireActionUser(supabase);

    const result = await createOrganizationSvc(
      supabase,
      name.trim(),
      slug.trim(),
      user.id as UUID
    );
    return { data: result, error: null };
  } catch (err) {
    // Do not leak internal details beyond the message.
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}
