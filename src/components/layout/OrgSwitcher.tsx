"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserOrganizationsAction } from "@/actions/organization/getUserOrganizations";
import { switchOrganization } from "@/actions/organization/switchOrganization";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

type OrgSwitcherProps = {
  collapsed: boolean;
};

export default function OrgSwitcher({ collapsed }: OrgSwitcherProps) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();

  const [orgs, setOrgs] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizations() {
      try {
        setLoading(true);
        setLoadError(null);

        const result = await getUserOrganizationsAction();
        if (!cancelled) {
          if (result.error || !result.data) {
            setOrgs([]);
            setLoadError(result.error?.message ?? "Unable to load organizations");
            return;
          }

          setOrgs(result.data);
        }
      } catch {
        if (!cancelled) {
          setOrgs([]);
          setLoadError("Unable to load organizations");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeOrg = useMemo(() => {
    return orgs.find((org) => org.id === orgId) ?? null;
  }, [orgId, orgs]);

  async function handleSwitch(targetOrgId: string) {
    if (!targetOrgId || targetOrgId === orgId) {
      return;
    }

    try {
      setSwitchingId(targetOrgId);
      setSwitchError(null);
      const result = await switchOrganization(targetOrgId);
      if (!result.success) {
        setSwitchError(result.error ?? "Failed to switch organization");
        return;
      }

      router.push(`/organizations/${targetOrgId}/inbox`);
      router.refresh();
    } finally {
      setSwitchingId(null);
    }
  }

  const activeLabel = activeOrg?.name ?? activeOrg?.slug ?? "Organization";

  if (collapsed) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        Loading organizations...
      </div>
    );
  }

  if (loadError) {
    return (
      <button
        type="button"
        onClick={() => router.refresh()}
        className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-xs text-red-700"
      >
        {loadError}. Click to retry.
      </button>
    );
  }

  if (orgs.length <= 1) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Organization</p>
        <p className="truncate text-sm font-semibold text-zinc-900">{activeLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Organization</p>
        <p className="truncate text-sm font-semibold text-zinc-900">{activeLabel}</p>
      </div>

      <select
        value={orgId}
        disabled={switchingId !== null}
        onChange={(e) => {
          void handleSwitch(e.target.value);
        }}
        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
      >
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name || org.slug}
          </option>
        ))}
      </select>

      {switchingId && (
        <p className="text-xs text-zinc-500">Switching organization...</p>
      )}

      {switchError && (
        <p className="text-xs text-red-600">{switchError}</p>
      )}
    </div>
  );
}
