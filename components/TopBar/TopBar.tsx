"use client";

import Image from "next/image";
import "./TopBar.css";

type Props = {
  section: "tasks" | "inbox" | "progress";
};

export default function TopBar({ section }: Props) {
  if (section === "tasks") return (
  
  <div className="rsidebar">
            
            
            <div className="assign">
   
    
    <button className="sidebar-btn createEmp">
        <Image
            src="/svg/createEmp.svg"
            alt="Draft icon"
            width={32}
            height={32}
          />
        <span className="tooltip">Add/Drop employee</span>
    </button>
    <button className="sidebar-btn assign-task-btn" id="openAssignModalBtn">
        <Image
            src="/svg/assignTask.svg"
            alt="Draft icon"
            width={32}
            height={32}
          />
        <span className="tooltip">Add task</span>
    </button>
    <button className="sidebar-btn switchEmp">
      
      <Image
            src="/svg/switchEmp.svg"
            alt="Draft icon"
            width={32}
            height={32}
          />
    <span className="tooltip">Switch employee</span>
    </button>
    
    <button className="sidebar-btn endDay">
      <Image
            src="/svg/endDay.svg"
            alt="Draft icon"
            width={32}
            height={32}
          />
            
        <span className="tooltip">Assign</span>
        
        </button>
    
</div>
<div className="empBarInfo">
        <span className="empDisplay"></span>
        
    </div>
        
        <button className="sidebar-btn draft">
            <Image
            src="/svg/draft.svg"
            alt="Draft icon"
            width={32}
            height={32}
          />
            <span className="tooltip">Draft</span>
        </button>
        

        </div>
  );
  if (section === "inbox") return <div className="topbar">Inbox UI</div>;
  if (section === "progress") return <div className="topbar">Progress UI</div>;

  return null;
}
