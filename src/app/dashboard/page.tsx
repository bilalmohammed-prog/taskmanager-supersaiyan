import { redirect } from "next/navigation";
import { resolveActiveOrganizationId } from "@/lib/auth/tenant-context";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function DashboardPage() {
  console.time("[perf] dashboard page total");
  const supabase = await getSupabaseServer();
  console.time("[perf] dashboard auth getUser");
  const { data: { user } } = await supabase.auth.getUser();
  console.timeEnd("[perf] dashboard auth getUser");

  if (!user) {
    console.timeEnd("[perf] dashboard page total");
    redirect("/auth/login");
  }

  console.time("[perf] dashboard resolveActiveOrganizationId");
  const orgId = await resolveActiveOrganizationId(supabase, user.id);
  console.timeEnd("[perf] dashboard resolveActiveOrganizationId");
  if (!orgId) {
    console.timeEnd("[perf] dashboard page total");
    redirect("/no-organization");
  }

  // Redirect to the org-scoped team page as the main dashboard
  console.timeEnd("[perf] dashboard page total");
  redirect(`/organizations/${orgId}/team`);
}
