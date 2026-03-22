import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { getAnalyticsSummary } from "@/actions/analytics/summary";
import { listProjectsAction } from "@/actions/project/list";
import { listAssignments } from "@/actions/assignment/list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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

  // Redirect to the org-scoped employees page as the main dashboard
  redirect(`/organizations/${orgId}/employees`);
}