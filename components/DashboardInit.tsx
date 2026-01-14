"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDashboard } from "@/components/Context/DashboardContext";

export default function DashboardInit() {
  const { data: session } = useSession();
  const { setcurrentManagerID } = useDashboard();

  useEffect(() => {
    if (!session?.user?.email) return;

    fetch(`/api/get-emp?email=${session.user.email}`)
      .then(res => res.json())
      .then(data => {
        if (data?.empID) {
          setcurrentManagerID(data.empID);
        }
      })
      .catch(console.error);
  }, [session, setcurrentManagerID]);

  return null; // this component renders nothing
}
