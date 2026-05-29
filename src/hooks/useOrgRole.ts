// src/hooks/useOrgRole.ts
"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

export function useOrgRole(orgIdOverride?: string) {
  const params = useParams();
  const orgIdParam = params.orgId;
  const orgIdFromParams = useMemo(() => {
    if (Array.isArray(orgIdParam)) return orgIdParam[0] ?? "";
    if (typeof orgIdParam === "string") return orgIdParam;
    return "";
  }, [orgIdParam]);
  const [role, setRole] = useState<string | null>(null);

  function isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  const orgId = useMemo(() => {
    if (orgIdOverride && isValidUuid(orgIdOverride)) return orgIdOverride;
    return orgIdFromParams;
  }, [orgIdFromParams, orgIdOverride]);

  useEffect(() => {
    if (!orgId || !isValidUuid(orgId)) return;
    // DUPLICATE CONTEXT LOAD
    // Role lookup repeats auth validation and membership lookup during project workspace hydration.
    console.time("[Fetch] useOrgRole role flow");
    console.time("[DB] auth/session useOrgRole");
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.timeEnd("[DB] auth/session useOrgRole");
      if (!user) {
        console.timeEnd("[Fetch] useOrgRole role flow");
        return;
      }
      console.time("[DB] membership lookup useOrgRole");
      supabase
        .from("org_members")
        .select("role")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          console.timeEnd("[DB] membership lookup useOrgRole");
          console.timeEnd("[Fetch] useOrgRole role flow");
          setRole(data?.role ?? null);
        });
    });
  }, [orgId]);

  return role;
}
