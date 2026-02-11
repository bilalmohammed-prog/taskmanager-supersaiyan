"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import ProfileMenu from "./ProfileMenu";
import { Button } from "./ui/button";

export function LeftSideBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <div
  className="
    fixed left-0 top-[60px]
    w-[72px]
    h-[calc(100vh-60px)]
    pt-[10px]
    bg-[#1e1e1e]
    border-r border-white/20
    z-[999]
    flex flex-col items-center gap-0

    max-[768px]:top-[50px]
    max-[768px]:w-[55px]
    max-[768px]:h-[calc(100vh-50px)]

    max-[600px]:top-[50px]
    max-[600px]:w-[50px]
    max-[600px]:h-[calc(100vh-50px)]
  "
>



  <Button variant="sidebar" onClick={() => router.push("/teamTasks")} className={isActive("/teamTasks") ? "bg-white/15" : ""}>
    <Image src="/svg/teamtasks.svg" alt="" width={22} height={22}/>
    <span className="text-[10px] font-medium text-white/90 leading-none">Team Tasks</span>
  </Button>

  <Button variant="sidebar" onClick={() => router.push("/userTasks")} className={isActive("/userTasks") ? "bg-white/15" : ""}>
    <Image src="/svg/tasks.svg" alt="" width={22} height={22}/>
    <span className="text-[10px] font-medium text-white/90 leading-none">Tasks</span>
  </Button>

  <Button variant="sidebar" onClick={() => router.push("/inbox")} className={isActive("/inbox") ? "bg-white/15" : ""}>
    <Image src="/svg/inbox.svg" alt="" width={22} height={22}/>
    <span className="text-[10px] font-medium text-white/90 leading-none">Inbox</span>
  </Button>

  <Button variant="sidebar" onClick={() => router.push("/progress")} className={isActive("/progress") ? "bg-white/15" : ""}>
    <Image src="/svg/progress.svg" alt="" width={22} height={22}/>
    <span className="text-[10px] font-medium text-white/90 leading-none">Progress</span>
  </Button>

  <div className="mt-auto p-[12px] pb-[10px]">

    <ProfileMenu />
  </div>

</div>

  );
}
