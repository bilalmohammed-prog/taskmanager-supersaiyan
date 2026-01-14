"use client";

import { useState, useEffect } from "react";
import { LeftSideBar } from "../../components/LeftSideBar/LeftSideBar";
import TopBar from "../../components/TopBar/TopBar";

import { useSession } from "next-auth/react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  



const { data: session } = useSession();


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
      
    } catch (err) {
      console.error("Failed to parse JSON", err);
    }
  }
  fetchManagerID();
}, [session]);



  return (
    <>
      <TopBar 
      
      />
      <LeftSideBar />
      
      {children}
    </>
  );
}
