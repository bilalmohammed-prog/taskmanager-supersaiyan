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
      
      // 1. Check if the response actually worked
      if (!res.ok) {
        console.error(`Error ${res.status}: Route not found or server error`);
        return;
      }

      // 2. Only parse if status is 200-299
      const data = await res.json();
      setManagerID(data?.empID || null);
    } catch (err) {
      console.error("Failed to parse JSON", err);
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
