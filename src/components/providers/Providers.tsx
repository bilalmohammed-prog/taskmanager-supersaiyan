"use client";

import type { ReactNode } from "react";

import { DashboardProvider } from "@/components/providers/dashboard/DashboardContext";
import { AuthEmployeeProvider } from "@/components/providers/auth/AuthContext";
import AuthBootstrap from "@/components/providers/auth/AuthBootstrap";
import AppGate from "@/components/providers/auth/AppGate";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthEmployeeProvider>
  <AuthBootstrap />

  <AppGate>
    <DashboardProvider>
      {children}
    </DashboardProvider>
  </AppGate>
</AuthEmployeeProvider>

  );
}
