"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import ComposeMessagePopup from "@/components/ComposeMessagePopup";

export default function TopBar() {
  const pathname = usePathname();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [composeMode, setComposeMode] = useState<"message" | "invite" | null>(null);

  const topbarCls = `
    fixed top-0 left-0 right-0
    h-13
    grid grid-cols-[1fr_auto_auto_1fr]
    items-center
    bg-card
    border-b border-border
    px-4
    z-[1000]
  `;

  useEffect(() => {
    async function loadUser(): Promise<void> {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Failed to load session:", error.message);
        return;
      }

      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    }

    loadUser();
  }, []);

  // AFTER
const isOrgRoute = pathname.includes("/organizations/");
const isEmployeesList =
  isOrgRoute && pathname.includes("/employees") && !pathname.match(/\/employees\/[^/]+$/);
const isEmployeeDetail =
  isOrgRoute && !!pathname.match(/\/employees\/[^/]+$/);
const isProjects =
  isOrgRoute && pathname.includes("/projects") && !pathname.match(/\/projects\/[^/]+$/);
const isAnalytics = isOrgRoute && pathname.includes("/analytics");
const isInbox = isOrgRoute && pathname.includes("/inbox");

  if (isEmployeesList) {
    return (
      <div className={topbarCls}>
        <div className="col-[2] flex gap-3">
          <Button variant="topbar" onClick={() => setComposeMode("invite")}>
            <Image src="/icons/createEmp.svg" alt="" width={22} height={22} />
            Invite Employee
          </Button>
        </div>
      </div>
    );
  }

  if (isEmployeeDetail) {
    return (
      <div className={topbarCls}>
        <Button variant="topbar">
          <Image src="/icons/addTask.svg" alt="" width={22} height={22} />
          Assign Task
        </Button>
      </div>
    );
  }

  if (isProjects) {
    return (
      <div className={topbarCls}>
        <Button variant="topbar">
          <Image src="/icons/addResource.svg" alt="" width={22} height={22} />
          Add Resource
        </Button>
      </div>
    );
  }

  if (isAnalytics) {
    return <div className={topbarCls} />;
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
          <Image src="/icons/draft.svg" alt="Draft" width={22} height={22} />
          Draft
        </Button>
      </div>
    );
  }

  if (!isOrgRoute) return null;

return <div className={topbarCls} />;
}