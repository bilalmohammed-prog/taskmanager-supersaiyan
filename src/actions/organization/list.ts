"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export async function listUserOrganizations() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("org_members")
    .select(`
      organization:organizations (
        id,
        name,
        slug
      )
    `)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  return data.map((d) => d.organization);
}
