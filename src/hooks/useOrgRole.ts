// src/hooks/useOrgRole.ts
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

export function useOrgRole() {
  const { orgId } = useParams<{ orgId: string }>();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("org_members")
        .select("role")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setRole(data?.role ?? null));
    });
  }, [orgId]);

  return role;
}