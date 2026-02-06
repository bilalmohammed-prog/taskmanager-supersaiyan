"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthEmployee } from "@/components/Context/AuthEmployeeContext";

export default function AuthBootstrap() {
  const { setEmployee, setHydrated } = useAuthEmployee();

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        console.log("BOOTSTRAP START");

        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const { data } = await supabase
            .from("empid")
            .select("emp_id, email, name, manager_id, user_id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (data && mounted) {
            setEmployee(data);
          }
        }

      } catch (err) {
        console.error("BOOTSTRAP ERROR:", err);
      } finally {
        if (mounted) {
          console.log("SETTING HYDRATED TRUE");
          setHydrated(true);   // GUARANTEED
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [setEmployee, setHydrated]);

  return <></>;
}
