"use client";

import Image from "next/image";
import "./TopBar.css";
import  SwitchEmpPopup from "../Popups/switchEmpPopup/switchEmpPopup";
import { useState } from "react";

type Props = {
  section: "tasks" | "inbox" | "progress" | "teamTasks";
};

export default function TopBar({ section }: Props) {

    const [showPopup, setShowPopup] = useState(false);

  if (section === "teamTasks")
    return (
      <>
        {showPopup && (
          <SwitchEmpPopup onClose={() => setShowPopup(false)} />
        )}

        <div className="rsidebar">
          <div className="assign">

            <button className="sidebar-btn createEmp">
              <Image src="/svg/createEmp.svg" alt="Draft icon" width={32} height={32}/>
              <span className="tooltip">Add/Drop employee</span>
            </button>

            <button className="sidebar-btn assign-task-btn" id="openAssignModalBtn">
              <Image src="/svg/assignTask.svg" alt="Draft icon" width={32} height={32}/>
              <span className="tooltip">Add task</span>
            </button>

            <button className="sidebar-btn switchEmp" onClick={() => setShowPopup(true)}>
              <Image src="/svg/switchEmp.svg" alt="Draft icon" width={32} height={32}/>
              <span className="tooltip">Switch employee</span>
            </button>

            <button className="sidebar-btn endDay">
              <Image src="/svg/endDay.svg" alt="Draft icon" width={32} height={32}/>
              <span className="tooltip">Assign</span>
            </button>

          </div>

          <div className="empBarInfo">
            <span className="empDisplay"></span>
          </div>
        </div>
      </>
    );
  


  
  if (section === "tasks")
    
    return (
  
  <div className="rsidebar">
            
            
            
<div className="empBarInfo">
        <span className="empDisplay"></span>
        
    </div>
        </div>
  );
    

  
  if (section === "progress")
    
    return (
  
  <div className="rsidebar">
            
            
            
<div className="empBarInfo">
        <span className="empDisplay"></span>
        
    </div>
        </div>
  );
    


  if (section === "inbox")

return (
  
  <div className="rsidebar">
            
            <button className="sidebar-btn draft">
            <Image
            src="/svg/draft.svg"
            alt="Draft icon"
            width={32}
            height={32}
          />
            <span className="tooltip">Draft</span>
        </button>
            
<div className="empBarInfo">
        <span className="empDisplay"></span>
        
    </div>
        </div>
  );


  return null;
}
