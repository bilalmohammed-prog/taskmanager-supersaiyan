import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-6">
        <div className="w-full rounded-xl border border-border bg-card p-8 shadow-none">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Authentication failed
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We could not complete your email confirmation or sign-in request. Please try
            logging in again, or request a new confirmation email if needed.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
