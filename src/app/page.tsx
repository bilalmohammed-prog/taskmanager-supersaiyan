import { redirect } from "next/navigation";
import { resolveActiveOrganizationId } from "@/lib/auth/tenant-context";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function Page() {
  console.time("[perf] [Page] root total");
  const supabase = await getSupabaseServer();

  console.time("[perf] [Fetch] root auth user");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.timeEnd("[perf] [Fetch] root auth user");

  if (!user) {
    console.timeEnd("[perf] [Page] root total");
    redirect("/auth/login");
  }

  console.time("[perf] [DB] root active organization");
  const organizationId = await resolveActiveOrganizationId(supabase, user.id);
  console.timeEnd("[perf] [DB] root active organization");

  if (!organizationId) {
    console.timeEnd("[perf] [Page] root total");
    redirect("/no-organization");
  }

  console.timeEnd("[perf] [Page] root total");
  redirect("/dashboard");
}
