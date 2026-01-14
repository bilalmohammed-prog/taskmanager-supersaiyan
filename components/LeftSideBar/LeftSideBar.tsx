"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import "./LeftSideBar.css";
import ProfileMenu from "../ProfileMenu/ProfileMenu";

export function LeftSideBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="lsidebar">

      <button
        className={`sidebar-btn managerAccess ${isActive("/teamTasks") ? "active" : ""}`}
        onClick={() => router.push("/teamTasks")}
      >
        <Image src="/svg/teamtasks.svg" alt="Team Tasks icon" width={32} height={32} />
        <span className="btn-label">Team Tasks</span>
      </button>

      <button
        className={`sidebar-btn empAccess ${isActive("/dashboard/tasks") ? "active" : ""}`}
        onClick={() => router.push("/dashboard/tasks")}
      >
        <Image src="/svg/tasks.svg" alt="Tasks icon" width={32} height={32} />
        <span className="btn-label">Tasks</span>
      </button>

      <button
        className={`sidebar-btn inbox ${isActive("/dashboard/inbox") ? "active" : ""}`}
        onClick={() => router.push("/dashboard/inbox")}
      >
        <Image src="/svg/inbox.svg" alt="Inbox icon" width={32} height={32} />
        <span className="btn-label">Inbox</span>
      </button>

      <button
        className={`sidebar-btn progress ${isActive("/dashboard/progress") ? "active" : ""}`}
        onClick={() => router.push("/dashboard/progress")}
      >
        <Image src="/svg/progress.svg" alt="Progress icon" width={32} height={32} />
        <span className="btn-label">Progress</span>
      </button>

      <div className="lsidebar-bottom">
        <ProfileMenu />
      </div>
    </div>
  );
}
