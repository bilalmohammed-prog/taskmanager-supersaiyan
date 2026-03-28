"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const MAX_REDIRECT_LENGTH = 1024;

function getSafeRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  const candidate = value.trim();

  if (
    candidate.length === 0 ||
    candidate.length > MAX_REDIRECT_LENGTH ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    /^https?:\/\//i.test(candidate)
  ) {
    return "/dashboard";
  }

  return candidate;
}

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const nextPath = getSafeRedirect(formData.get("redirect"));

  const supabase = await getSupabaseServer();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("email not confirmed")) {
      return { error: "Please confirm your email before logging in" };
    }

    if (message.includes("invalid login credentials")) {
      return { error: "Invalid email or password" };
    }

    return { error: error.message };
  }

  redirect(nextPath);
}
