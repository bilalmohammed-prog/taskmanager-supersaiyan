"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useDashboard } from "@/components/Context/DashboardContext";

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
        .from("empid")
        .select("managerid")
        .maybeSingle();

      if (!empError && data?.managerid) {
        setcurrentManagerID(data.managerid);
      }
    }

    initDashboard();
  }, [setcurrentManagerID]);

  return null;
}
