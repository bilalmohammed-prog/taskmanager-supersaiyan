"use client";

import { LeftSideBar } from "../../components/LeftSideBar/LeftSideBar";
import TopBar from "../../components/TopBar/TopBar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <TopBar />
      <LeftSideBar />
      {children}
    </>
  );
}
