import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function NoOrganizationPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen w-full bg-background flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">No organization access</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account is signed in, but it is not currently a member of any organization.
          If you were removed from an organization, ask an admin to send a new invite.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium"
          >
            Retry
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Create organization
          </Link>
        </div>
      </section>
    </main>
  );
}
