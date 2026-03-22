"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginAction, type LoginState } from "@/actions/auth/login";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-6 p-6 md:p-8 lg:grid-cols-2 lg:gap-0 lg:p-10">
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-8 md:p-10 lg:rounded-r-none">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                RO
              </div>
              <div>
                <p className="font-heading text-lg font-bold tracking-tight">ResourceOS</p>
                <p className="font-body text-xs font-normal leading-relaxed text-muted-foreground">
                  Workspace Intelligence
                </p>
              </div>
            </div>

            <Badge className="w-fit rounded-md border border-border bg-accent px-3 py-1 text-xs text-accent-foreground">
              Operational Command Center
            </Badge>

            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight md:text-5xl">
                Plan work. Align teams. Deliver outcomes.
              </h1>
              <p className="font-body max-w-xl text-base font-normal leading-relaxed text-muted-foreground">
                ResourceOS gives every organization one shared surface for tasks, assignments, and
                execution velocity.
              </p>
            </div>
          </div>

          <div className="grid gap-px rounded-lg border border-border bg-border">
            <div className="grid grid-cols-3 gap-px">
              <div className="bg-card p-4">
                <p className="font-body text-xs text-muted-foreground">Teams</p>
                <p className="font-heading pt-1 text-2xl font-bold tracking-tight">8</p>
              </div>
              <div className="bg-card p-4">
                <p className="font-body text-xs text-muted-foreground">Active Tasks</p>
                <p className="font-heading pt-1 text-2xl font-bold tracking-tight">148</p>
              </div>
              <div className="bg-card p-4">
                <p className="font-body text-xs text-muted-foreground">On-time Rate</p>
                <p className="font-heading pt-1 text-2xl font-bold tracking-tight">94%</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="h-fit rounded-xl border border-border bg-card shadow-none lg:rounded-l-none">
          <CardHeader className="space-y-2 p-8 md:p-10 md:pb-4">
            <CardTitle className="font-heading text-3xl font-bold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="font-body text-sm font-normal leading-relaxed text-muted-foreground">
              Enter your credentials to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8 pt-2 md:p-10 md:pt-2">
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body text-sm font-normal">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="h-10 rounded-md border border-border bg-background shadow-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-body text-sm font-normal">
                    Password
                  </Label>
                  <Link href="#" className="font-body text-xs font-normal text-primary underline-offset-4 hover:underline">
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
                  className="h-10 rounded-md border border-border bg-background shadow-none"
                />
              </div>

              {state.error && (
                <p className="text-sm font-medium text-destructive">{state.error}</p>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="h-10 w-full rounded-md bg-primary text-primary-foreground shadow-none"
              >
                {isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <Separator />

            <div className="space-y-3">
              <Button variant="outline" className="h-10 w-full rounded-md border border-border shadow-none">
                Request Demo
              </Button>
              <p className="font-body text-center text-sm font-normal leading-relaxed text-muted-foreground">
                New to the platform?{" "}
                <Link href="/auth/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}