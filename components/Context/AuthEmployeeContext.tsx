"use client";

import { createContext, useContext, useState } from "react";

/**
 * Verified employee identity for the currently authenticated user.
 * This is a CACHE of already-authorized data — NOT a source of truth.
 */
export interface AuthEmployee {
  emp_id: string;
  email: string;
  name: string;
  manager_id: string | null;
}

interface AuthEmployeeContextType {
  employee: AuthEmployee | null;
  setEmployee: (employee: AuthEmployee | null) => void;
}

const AuthEmployeeContext =
  createContext<AuthEmployeeContextType | undefined>(undefined);

export function AuthEmployeeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [employee, setEmployee] = useState<AuthEmployee | null>(null);

  return (
    <AuthEmployeeContext.Provider value={{ employee, setEmployee }}>
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
