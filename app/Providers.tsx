"use client";

import { DashboardProvider } from "@/components/Context/DashboardContext";
import { AuthEmployeeProvider } from "@/components/Context/AuthEmployeeContext";
import AuthBootstrap from "@/components/Auth/AuthBootstrap";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthEmployeeProvider>
      <AuthBootstrap />
      <DashboardProvider>
        {children}
      </DashboardProvider>
    </AuthEmployeeProvider>
  );
}
