"use client";

import { DashboardProvider,useDashboard } from "@/components/Context/DashboardContext";
import { LeftSideBar } from "@/components/LeftSideBar/LeftSideBar";
import TopBar from "@/components/TopBar/TopBar";

import { useEffect } from "react";
import { useSession } from "next-auth/react";


function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { setcurrentManagerID } = useDashboard(); // ✅ NOW LEGAL

  useEffect(() => {
    if (!session?.user?.email) return;

    fetch(`/api/get-emp?email=${session.user.email}`)
      .then(res => res.json())
      .then(data => setcurrentManagerID(data.empID))
      .catch(console.error);
  }, [session, setcurrentManagerID]);

  return (
    <div className="dashboard-shell">
      <LeftSideBar />
      <TopBar />
      <main>{children}</main>
    </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

 

  return (
    <DashboardProvider>
      <DashboardShell>
        <main>{children}</main>
      </DashboardShell>
    </DashboardProvider>
  );
}
