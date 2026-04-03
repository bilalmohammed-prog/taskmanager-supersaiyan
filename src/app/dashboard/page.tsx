import { redirect } from "next/navigation";
import { resolveActiveOrganizationId } from "@/lib/auth/tenant-context";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const orgId = await resolveActiveOrganizationId(supabase, user.id);
  if (!orgId) redirect("/no-organization");

  // Redirect to the org-scoped team page as the main dashboard
  redirect(`/organizations/${orgId}/team`);
}