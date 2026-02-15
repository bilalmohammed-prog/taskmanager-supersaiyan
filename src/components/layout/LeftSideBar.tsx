"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import ProfileMenu from "@/components/ProfileMenu";
import { Button } from "@/components/ui/button";

export default function LeftSideBar() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract orgId from /organizations/[orgId]/...
  const orgId = pathname.split("/")[2];

  const go = (path: string) => {
    if (!orgId) return;
    router.push(`/organizations/${orgId}/${path}`);
  };

  const isActive = (path: string) =>
    pathname.includes(`/${path}`);

  return (
    <div
      className="
        fixed left-0 w-16 top-13 bottom-0
        pt-[10px]
        bg-[#1e1e1e]
        border-r border-white/20
        z-[999]
        flex flex-col items-center gap-0
      "
    >
      <Button
  variant="sidebar"
  onClick={() => router.push("/organizations/3c32a226-5f92-45ae-b8bb-5e4209cb29a5/employees")}
>
  Employees
</Button>

      {/* <Button
        variant="sidebar"
        onClick={() => go("tasks")}
        className={isActive("tasks") ? "bg-white/15" : ""}
      >
        <Image src="/icons/tasks.svg" alt="" width={22} height={22} />
        <span className="text-[10px] text-white/90">Tasks</span>
      </Button> */}

      <Button
        variant="sidebar"
        onClick={() => go("resources")}
        className={isActive("resources") ? "bg-white/15" : ""}
      >
        <Image src="/icons/createEmp.svg" alt="" width={22} height={22} />
        <span className="text-[10px] text-white/90">Resources</span>
      </Button>

      {/* <Button
        variant="sidebar"
        onClick={() => go("assignments")}
        className={isActive("assignments") ? "bg-white/15" : ""}
      >
        <Image src="/icons/assignTask.svg" alt="" width={22} height={22} />
        <span className="text-[10px] text-white/90">Assignments</span>
      </Button> */}

      <Button
        variant="sidebar"
        onClick={() => go("analytics")}
        className={isActive("analytics") ? "bg-white/15" : ""}
      >
        <Image src="/icons/progress.svg" alt="" width={22} height={22} />
        <span className="text-[10px] text-white/90">Analytics</span>
      </Button>

      <div className="mt-auto p-[12px] pb-[10px]">
        <ProfileMenu />
      </div>
    </div>
  );
}
