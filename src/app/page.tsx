import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.active_organization_id) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}