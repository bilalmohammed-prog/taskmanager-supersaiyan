"use client";

import { useEffect } from "react";
import { DashboardProvider, useDashboard } from "@/components/Context/DashboardContext";
import { LeftSideBar } from "@/components/LeftSideBar/LeftSideBar";
import TopBar from "@/components/TopBar/TopBar";
import { supabase } from "@/lib/supabaseClient";

interface DashboardShellProps {
  children: React.ReactNode;
}

function DashboardShell({ children }: DashboardShellProps) {
  const { setcurrentManagerID } = useDashboard();

  useEffect(() => {
    async function loadManager(): Promise<void> {
      // 1️⃣ Get authenticated user (cookie-based)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 2️⃣ RLS-enforced query (NO filters)
      const { data, error } = await supabase
        .from("empid")
        .select("managerid")
        .maybeSingle();

      if (!error && data?.managerid) {
        setcurrentManagerID(data.managerid);
      }
    }

    loadManager();
  }, [setcurrentManagerID]);

  return (
  <div className="dashboard-shell">
    <TopBar />
    <LeftSideBar />
    <main>{children}</main>
  </div>
);

}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
    </DashboardProvider>
  );
}
