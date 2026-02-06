"use client";

import { DashboardProvider } from "@/components/Context/DashboardContext";
import { AuthEmployeeProvider } from "@/components/Context/AuthEmployeeContext";
import AuthBootstrap from "@/components/Auth/AuthBootstrap";
import AppGate from "@/components/Auth/AppGate"; // ADD

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthEmployeeProvider>
      <AuthBootstrap />

      {/* NEW GATE */}
      <AppGate>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </AppGate>

    </AuthEmployeeProvider>
  );
}
