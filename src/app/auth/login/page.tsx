import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <main className="w-full bg-background text-foreground">
      <section className="mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 gap-6 px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-8">
          <Badge className="w-fit rounded-md border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            Multi-tenant Workspace
          </Badge>
          <div className="space-y-4">
            <h1
              className="text-balance text-4xl font-extrabold tracking-[-0.06em] md:text-5xl"
              style={{ fontFamily: "Syne, 'DM Sans', sans-serif" }}
            >
              Sign in to your organization
            </h1>
            <p
              className="max-w-xl text-base font-normal leading-[1.65] text-muted-foreground"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Manage projects, tasks, assignments, and team communication in one place with
              organization-scoped access.
            </p>
          </div>
          <div className="grid gap-px rounded-lg border border-border bg-border">
            <div className="grid grid-cols-2 gap-px">
              <div className="rounded-tl-lg bg-card p-4">
                <p className="text-xs text-muted-foreground">Projects</p>
                <p className="pt-1 text-2xl font-bold tracking-[-0.04em]">12</p>
              </div>
              <div className="rounded-tr-lg bg-card p-4">
                <p className="text-xs text-muted-foreground">Open Tasks</p>
                <p className="pt-1 text-2xl font-bold tracking-[-0.04em]">48</p>
              </div>
            </div>
            <div className="rounded-b-lg bg-card p-4">
              <p className="text-xs text-muted-foreground">Active Members</p>
              <p className="pt-1 text-2xl font-bold tracking-[-0.04em]">23</p>
            </div>
          </div>
        </div>

        <Card className="h-fit rounded-xl border border-border bg-card">
          <CardHeader className="space-y-2">
            <CardTitle
              className="text-2xl font-bold tracking-[-0.04em]"
              style={{ fontFamily: "Syne, 'DM Sans', sans-serif" }}
            >
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your credentials to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="h-10 border-input bg-background"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-10 border-input bg-background"
                />
              </div>

              <Button type="submit" className="h-10 w-full rounded-md bg-primary text-primary-foreground">
                Sign in
              </Button>
            </form>

            <Separator />

            <p className="text-center text-sm text-muted-foreground">
              New to the platform?{" "}
              <Link href="/auth/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

