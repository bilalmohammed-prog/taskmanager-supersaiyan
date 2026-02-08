"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

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
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

const AuthEmployeeContext =
  createContext<AuthEmployeeContextType | undefined>(undefined);

export function AuthEmployeeProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<AuthEmployee | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function fetchEmployee() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setEmployee(null);
        setHydrated(true);
        return;
      }

      const { data } = await supabase
        .from("empid")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setEmployee(data ?? null);
      setHydrated(true);
    }

    // Initial fetch
    fetchEmployee();

    // Listen for login/logout
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) fetchEmployee();
        else {
          setEmployee(null);
          setHydrated(true);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthEmployeeContext.Provider
      value={{
        employee,
        setEmployee,
        hydrated,
        setHydrated,
      }}
    >
      {children}
    </AuthEmployeeContext.Provider>
  );
}

export function useAuthEmployee(): AuthEmployeeContextType {
  const ctx = useContext(AuthEmployeeContext);
  if (!ctx) {
    throw new Error("useAuthEmployee must be used inside AuthEmployeeProvider");
  }
  return ctx;
}
