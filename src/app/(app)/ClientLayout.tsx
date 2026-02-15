"use client";

import  LeftSideBar  from "@/components/layout/LeftSideBar";
import TopBar from "@/components/layout/TopBar";

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
