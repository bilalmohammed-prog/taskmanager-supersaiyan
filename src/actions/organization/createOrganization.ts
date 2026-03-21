"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { UUID } from "@/lib/types/database";
import { requireActionUser } from "@/actions/_helpers/requireOrgContext";
import {
  createOrganization as createOrganizationSvc,
  type CreateOrganizationResult,
} from "@/services/organization/organization.service";
import { safeErrorMessage, type ActionResult } from "./_shared";
import { z } from "zod";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and URL-safe (e.g. my-org)"),
});

export async function createOrganization(
  name: unknown,
  slug: unknown
): Promise<ActionResult<CreateOrganizationResult>> {
  try {
    const validated = createOrganizationSchema.parse({ name, slug });

    const supabase = await getSupabaseServer();
    const { user } = await requireActionUser(supabase);

    const result = await createOrganizationSvc(
      supabase,
      validated.name,
      validated.slug,
      user.id as UUID
    );
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: { message: safeErrorMessage(err) } };
  }
}