"use client";

import ComposeMessagePopup from "@/components/ComposeMessagePopup";

import Image from "next/image";


import  SwitchEmpPopup from "@/components/switchEmpPopup";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useEffect } from "react";

import { usePathname } from "next/navigation";
import { useDashboard } from "@/components/providers/dashboard/DashboardContext";

import { Button } from "@/components/ui/button";

export default function TopBar() {

    const pathname = usePathname();

    const [userEmail, setUserEmail] = useState<string | null>(null);

    const topbarCls = `
  fixed top-0 left-0 right-0
  h-13
  grid grid-cols-[1fr_auto_auto_1fr]
  items-center
  bg-[#1E1E1E]
  border-b border-white/25
  px-4
  z-[1000]
`;

  

    
  const [composeMode, setComposeMode] = useState<"message" | "invite" | null>(null);

  const [showChoiceModal, setShowChoiceModal] = useState(false);
  
const isEmployeesList = pathname.includes("/employees") && !pathname.match(/\/employees\/[^/]+$/);
const isEmployeeDetail = pathname.match(/\/employees\/[^/]+$/);
const isProjects = pathname.includes("/projects") && !pathname.match(/\/projects\/[^/]+$/);
const isAnalytics = pathname.includes("/analytics");
const isInbox = pathname.includes("/inbox");


  const [authChecked, setAuthChecked] = useState(false);


useEffect(() => {
  async function loadUser(): Promise<void> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Failed to load session:", error.message);
      setAuthChecked(true);
      return;
    }

    if (session?.user?.email) {
      setUserEmail(session.user.email);
    }

    setAuthChecked(true);
  }

  loadUser();
}, []);






  

if (isEmployeesList) {
  return (
    <div className={topbarCls}>
      <div className="col-[2] flex gap-3">
        <Button variant="topbar" onClick={() => setComposeMode("invite")}>
          <Image src="/icons/createEmp.svg" alt="" width={22} height={22}/>
          Invite Employee
        </Button>
      </div>
    </div>
  );
}

if(isEmployeeDetail) 
  return (
    <div className={topbarCls}>
      <Button variant="topbar">
        <Image src="/icons/addTask.svg" alt="" width={22} height={22}/>
        Assign Task
      </Button>
    </div>
  );

if (isProjects) {
  return (
    <div className={topbarCls}>
      <Button variant="topbar">
        <Image src="/icons/addResource.svg" alt="" width={22} height={22}/>
        Add Resource
      </Button>
    </div>
  );
}
if (isAnalytics) {
  return <div className={topbarCls}></div>;
}


    


    


  if (isInbox) {
    return (
      <div className={topbarCls}>

        {composeMode && (
  <ComposeMessagePopup 
    userEmail={userEmail ?? ""}

    fixedType={composeMode} 
    onClose={() => setComposeMode(null)} 
  />
)}

        <Button variant="topbar" onClick={() => setComposeMode("message")}>
  <Image src="/icons/draft.svg" alt="Draft" width={22} height={22}/>
  Draft
</Button>



        <div className="
  col-[4]
  justify-self-end
  text-white
  text-[16px]
  whitespace-nowrap
">
<span className="whitespace-nowrap">
</span>
        </div>
      </div>
    );
  }
  


  return null;
}
