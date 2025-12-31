"use client";

import { useState } from "react";
import { LeftSideBar } from "./LeftSideBar/LeftSideBar";
import TopBar from "./TopBar/TopBar";
import Cobox from "./Cobox/Cobox"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [section, setSection] =
    useState<"tasks" | "inbox" | "progress" | "teamTasks">("tasks");

const [selectedEmp, setSelectedEmp] =
    useState<{ name: string; empID: string } | null>(null);
const [openAssignModal, setOpenAssignModal] = useState(false);


  return (
    <>
      <TopBar 
      section={section}
      selectedEmp={selectedEmp}
      setSelectedEmp={setSelectedEmp}
      setOpenAssignModal={setOpenAssignModal}
      />
      <LeftSideBar setSection={setSection} />
      <Cobox section={section}
      selectedEmp={selectedEmp}
      openAssignModal={openAssignModal}
      setOpenAssignModal={setOpenAssignModal}
      />
      {children}
    </>
  );
}
