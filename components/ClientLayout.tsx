"use client";

import { useState, useEffect } from "react";
import { LeftSideBar } from "./LeftSideBar/LeftSideBar";
import TopBar from "./TopBar/TopBar";
import Cobox from "./Cobox/Cobox"
import { useSession } from "next-auth/react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [section, setSection] =
    useState<"tasks" | "inbox" | "progress" | "teamTasks">("tasks");

const [selectedEmp, setSelectedEmp] =
    useState<{ name: string; empID: string } | null>(null);
const [openAssignModal, setOpenAssignModal] = useState(false);

const { data: session } = useSession();

  const [managerID, setManagerID] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;

    async function fetchManagerID() {
      try {
        const res = await fetch(`/api/get-emp?email=${session?.user?.email}`);
        const data = await res.json();
        // Store the manager's own empID to use as a filter for their team
        setManagerID(data?.empID || null);
      } catch (err) {
        console.error("Error fetching manager data", err);
      }
    }
    fetchManagerID();
  }, [session]);



  return (
    <>
      <TopBar 
      section={section}
      selectedEmp={selectedEmp}
      setSelectedEmp={setSelectedEmp}
      setOpenAssignModal={setOpenAssignModal}
      currentManagerID={managerID}
      />
      <LeftSideBar setSection={setSection} />
      <Cobox section={section}
      selectedEmp={selectedEmp}
      openAssignModal={openAssignModal}
      setOpenAssignModal={setOpenAssignModal}
      currentManagerID={managerID}
      />
      {children}
    </>
  );
}
