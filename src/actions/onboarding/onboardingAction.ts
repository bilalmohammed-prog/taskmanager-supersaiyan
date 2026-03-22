"use server";

import { redirect } from "next/navigation";
import { createOrganization } from "@/actions/organization/createOrganization";

type OnboardingState = { error: string | null };

export async function onboardingAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!name || !slug) return { error: "Name and slug are required" };

  const result = await createOrganization(name, slug);

  if (result.error) return { error: result.error.message };

  redirect(`/organizations/${result.data.organization.id}/employees`);
}