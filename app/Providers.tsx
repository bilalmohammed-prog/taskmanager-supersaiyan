"use client";

import { DashboardProvider } from "@/components/Context/DashboardContext";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>
    <DashboardProvider>
    {children}
    </DashboardProvider>
    </SessionProvider>;
}
