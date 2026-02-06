"use client";

import { createContext, useContext, useState } from "react";

/**
 * Verified employee identity for the currently authenticated user.
 * CACHE only — not source of truth.
 */
export interface AuthEmployee {
  emp_id: string;
  email: string;
  name: string;
  user_id: string | null;
  manager_id: string | null;
}

interface AuthEmployeeContextType {
  employee: AuthEmployee | null;
  setEmployee: (employee: AuthEmployee | null) => void;

  // ADD THESE 👇
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

const AuthEmployeeContext =
  createContext<AuthEmployeeContextType | undefined>(undefined);

export function AuthEmployeeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [employee, setEmployee] = useState<AuthEmployee | null>(null);

  // ADD THIS 👇
  const [hydrated, setHydrated] = useState(false);

  return (
    <AuthEmployeeContext.Provider
      value={{
        employee,
        setEmployee,
        hydrated,     // ADD
        setHydrated,  // ADD
      }}
    >
      {children}
    </AuthEmployeeContext.Provider>
  );
}

export function useAuthEmployee(): AuthEmployeeContextType {
  const ctx = useContext(AuthEmployeeContext);
  if (!ctx) {
    throw new Error(
      "useAuthEmployee must be used inside AuthEmployeeProvider"
    );
  }
  return ctx;
}
