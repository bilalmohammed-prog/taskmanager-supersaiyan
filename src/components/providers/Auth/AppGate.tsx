"use client";

import { useAuthEmployee } from "@/components/providers/auth/AuthContext";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const { hydrated } = useAuthEmployee();


  // wait until Supabase session + employee is loaded
  if (!hydrated) {
    return (
      <div style={{
        height: "100vh",
        background: "#0f0f0f"
      }} />
    );
  }

  return <>{children}</>;
}
