"use client";

import { useState } from "react";
import { LeftSideBar } from "./LeftSideBar/LeftSideBar";
import TopBar from "./TopBar/TopBar";
import Cobox from "./Cobox/Cobox"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [section, setSection] =
    useState<"tasks" | "inbox" | "progress" | "teamTasks">("tasks");

  return (
    <>
      <TopBar section={section} />
      <LeftSideBar setSection={setSection} />
      <Cobox section={section}/>
      {children}
    </>
  );
}
