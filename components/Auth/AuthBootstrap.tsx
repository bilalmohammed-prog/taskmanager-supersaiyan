"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthEmployee } from "@/components/Context/AuthEmployeeContext";

export default function AuthBootstrap() {
  const { setEmployee } = useAuthEmployee();

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) return;

      const { data, error: empError } = await supabase
        .from("empid")
        .select("emp_id, email, name, manager_id, user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!empError && data) {
        setEmployee(data);
      }
    }

    bootstrap();
  }, [setEmployee]);
  

  return null;
}
