import { redirect } from "next/navigation";
import { resolveActiveOrganizationId } from "@/lib/auth/tenant-context";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const organizationId = await resolveActiveOrganizationId(supabase, user.id);

  if (!organizationId) {
    redirect("/no-organization");
  }

  redirect("/dashboard");
}