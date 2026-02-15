"use client";

import { useEffect } from "react";
import { DashboardProvider, useDashboard } from "@/components/providers/dashboard/DashboardContext";
import LeftSideBar from "@/components/layout/LeftSideBar";
import TopBar from "@/components/layout/TopBar";
import { supabase } from "@/lib/supabase/client";

interface DashboardShellProps {
  children: React.ReactNode;
}

function DashboardShell({ children }: DashboardShellProps) {
  const { setCurrentUserId } = useDashboard();

  useEffect(() => {
    async function loadUser(): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Use profiles instead of empid
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.id) {
        setCurrentUserId(data.id);
      }
    }

    loadUser();
  }, [setCurrentUserId]);

  return (
    <div className="dashboard-shell flex min-h-screen">
      <LeftSideBar />
      <div className="flex-1">
        <TopBar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
