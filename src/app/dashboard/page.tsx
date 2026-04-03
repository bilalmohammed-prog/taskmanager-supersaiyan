import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = profile?.active_organization_id;
  if (!orgId) redirect("/onboarding");

  // Redirect to the org-scoped team page as the main dashboard
  redirect(`/organizations/${orgId}/team`);
}