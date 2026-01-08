"use client";

import ComposeMessagePopup from "../Popups/ComposeMessagePopup/ComposeMessagePopup";

import Image from "next/image";
import "./TopBar.css";
import  SwitchEmpPopup from "../Popups/switchEmpPopup/switchEmpPopup";
import { useState } from "react";
import { useSession } from "next-auth/react";

type Props = {
  section: "tasks" | "inbox" | "progress" | "teamTasks";
  selectedEmp: { name: string; empID: string } | null;
  setSelectedEmp: React.Dispatch<
    React.SetStateAction<{ name: string; empID: string } | null>
  >;
  setOpenAssignModal: React.Dispatch<React.SetStateAction<boolean>>;
  currentManagerID: string | null;
};

export default function TopBar({ section, selectedEmp, setSelectedEmp, setOpenAssignModal,currentManagerID }: Props) {

    const { data: session } = useSession();
    const [showPopup, setShowPopup] = useState(false);
    
  const [composeMode, setComposeMode] = useState<"message" | "invite" | null>(null);

  if (section === "teamTasks")
    return (
      <>

      {/* Add this here */}
{composeMode === "invite" && (
  <ComposeMessagePopup 
    userEmail={session?.user?.email || ""} 
    currentManagerID={currentManagerID} 
    fixedType="invite" 
    onClose={() => setComposeMode(null)} 
  />
)}

        {showPopup && (
  <SwitchEmpPopup
  currentManagerID={currentManagerID}
    onClose={() => setShowPopup(false)}
    onSelect={(emp) => {
      setSelectedEmp(emp);
      setShowPopup(false);
    }}
    selectedEmpID={selectedEmp?.empID || null}
  />
)}


        <div className="rsidebar">
          <div className="assign">

            <button className="sidebar-btn createEmp" onClick={() => setComposeMode("invite")}>
  <Image src="/svg/createEmp.svg" alt="Draft icon" width={32} height={32}/>
  <span className="tooltip">Add/Drop employee</span>
</button>

            <button
  className="sidebar-btn assign-task-btn"
  onClick={() => {
    if (!selectedEmp) {
      alert("Select an employee first");
      return;
    }
    setOpenAssignModal(true);
  }}
>
  <Image src="/svg/assignTask.svg" alt="Draft icon" width={32} height={32}/>
  <span className="tooltip">Add task</span>
</button>


            <button className="sidebar-btn switchEmp" onClick={() => setShowPopup(true)}>
              <Image src="/svg/switchEmp.svg" alt="Draft icon" width={32} height={32}/>
              <span className="tooltip">Switch employee</span>
            </button>

            <button className="sidebar-btn endDay" onClick={() => {
    setSelectedEmp(null);      // remove employee selection
    setOpenAssignModal(false); // close assign modal if open
  }}>
              <Image src="/svg/endDay.svg" alt="Draft icon" width={32} height={32}/>
              <span className="tooltip">Assign</span>
            </button>

          </div>

          <div className="empBarInfo">
  <span className="empDisplay">
    {selectedEmp
      ? `${selectedEmp.name} (${selectedEmp.empID})`
      : "No employee selected"}
  </span>
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
    


  if (section === "inbox") {
    return (
      <div className="rsidebar">
        {composeMode && (
  <ComposeMessagePopup 
    userEmail={session?.user?.email || ""} 
    currentManagerID={currentManagerID} 
    fixedType={composeMode} 
    onClose={() => setComposeMode(null)} 
  />
)}

        <button className="sidebar-btn draft" onClick={() => setComposeMode("message")}>
          <Image src="/svg/draft.svg" alt="Draft icon" width={32} height={32} />
          <span className="tooltip">Compose</span>
        </button>

        <div className="empBarInfo">
          <span className="empDisplay"></span>
        </div>
      </div>
    );
  }
  


  return null;
}
