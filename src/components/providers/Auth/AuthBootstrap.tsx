"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthEmployee } from "@/components/providers/auth/AuthContext";

export default function AuthBootstrap() {
  const { setEmployee, setHydrated } = useAuthEmployee();

  useEffect(() => {
    let mounted = true;

    async function init() {
      console.log("BOOTSTRAP START");

      try {
        const {
  data: { user },
  error,
} = await supabase.auth.getUser();

if (error) {
  // only log real failures
  if (!error.message.includes("session")) {
    console.error("Auth error:", error.message);
  }
}


        if (!mounted) return;

        // No user = normal state
        if (!user) {
          setEmployee(null);
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch failed:", profileError.message);
        }

        if (mounted) {
          setEmployee(data ?? null);
        }
      } catch (err) {
        // Only unexpected exceptions land here
        console.error("BOOTSTRAP UNEXPECTED ERROR:", err);
      } finally {
        if (mounted) {
          console.log("SETTING HYDRATED TRUE");
          setHydrated(true);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [setEmployee, setHydrated]);

  return null;
}
