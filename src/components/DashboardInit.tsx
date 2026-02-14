"use client";

import { useEffect } from "react";
import { supabase } from "@/src/lib/supabase/supabaseClient";
import { useDashboard } from "@/src/components/Context/DashboardContext";

export default function DashboardInit() {
  const { setcurrentManagerID } = useDashboard();

  useEffect(() => {
    async function initDashboard(): Promise<void> {
      // 1️⃣ Resolve auth safely
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        return;
      }

      // 2️⃣ RLS-enforced read (row may not exist yet)
      const { data, error: empError } = await supabase
        .from("employees")
        .select("manager_id")
        .maybeSingle();

      if (!empError && data?.manager_id) {
        setcurrentManagerID(data.manager_id);
      }
    }

    initDashboard();
  }, [setcurrentManagerID]);

  return null;
}
