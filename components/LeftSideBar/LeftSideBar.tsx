"use client";

import Image from "next/image";
import "./LeftSideBar.css";

type Props = {
  setSection: (s: "tasks" | "inbox" | "progress" | "teamTasks") => void;
};

export function LeftSideBar({setSection}:Props){

    return (
        <div className="lsidebar">
        
        <button className="sidebar-btn managerAccess" onClick={() => setSection("teamTasks")}>
            <span className="tooltip">Team Tasks</span>
            {/* TeamTasks SVG */}
            <Image
            src="/svg/teamtasks.svg"
            alt="Team Tasks icon"
            width={32}
            height={32}
          />
        </button>
        <button className="sidebar-btn empAccess" onClick={() => setSection("tasks")}>
            {/* Tasks */}
            <Image
            src="/svg/tasks.svg"
            alt="Team Tasks icon"
            width={32}
            height={32}
          />
            <span className="tooltip">Tasks</span>
            
        </button>
        <button className="sidebar-btn inbox" onClick={() => setSection("inbox")}>
            {/* inbox */}
            <Image
            src="/svg/inbox.svg"
            alt="Inbox icon"
            width={32}
            height={32}
          />
            <span className="tooltip">Inbox</span>
        </button>
        <button className="sidebar-btn progress" onClick={() => setSection("progress")}>
            <Image
            src="/svg/progress.svg"
            alt="Inbox icon"
            width={32}
            height={32}
          />
            <span className="tooltip">Progress</span>
        </button>

        {/* <!-- profile btn --> */}
         <div className="lsidebar-bottom">

  <div className="profile-wrapper">
      <div className="profile-icon">
        <span id="profileInitial">U</span>
      </div>

      
  </div>

</div>


    </div>
    );
}