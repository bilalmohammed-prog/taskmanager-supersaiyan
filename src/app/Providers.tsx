"use client";

import { DashboardProvider } from "@/src/components/Context/DashboardContext";
import { AuthEmployeeProvider } from "@/src/components/Context/AuthEmployeeContext";
import AuthBootstrap from "@/src/components/Auth/AuthBootstrap";
import AppGate from "@/src/components/Auth/AppGate"; // ADD

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
