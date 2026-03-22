"use client";

import { useActionState } from "react";
import { onboardingAction } from "@/actions/onboarding/onboardingAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(onboardingAction, { error: null });

  return (
    <main className="min-h-screen w-full bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-none border border-border">
        <CardHeader className="space-y-1 p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              RO
            </div>
            <p className="font-heading text-lg font-bold tracking-tight">ResourceOS</p>
          </div>
          <CardTitle className="font-heading text-2xl font-bold tracking-tight">
            Create your organization
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            You are almost in. Set up your workspace to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-2">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Acme Inc."
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="acme-inc"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            {state.error && (
              <p className="text-sm font-medium text-destructive">{state.error}</p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="h-10 w-full"
            >
              {isPending ? "Creating…" : "Create organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}