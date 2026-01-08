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

  const [showChoiceModal, setShowChoiceModal] = useState(false);

const handleDropEmployee = async () => {
  if (!selectedEmp) return alert("Please select an employee to drop first.");
  
  const confirmDrop = confirm(`Are you sure you want to remove ${selectedEmp.name} from your team?`);
  if (!confirmDrop) return;

  try {
    const res = await fetch(`../api/invites/drop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empID: selectedEmp.empID }),
    });

    if (res.ok) {
      alert("Employee dropped successfully.");
      setSelectedEmp(null); // Clear the selection as they are no longer yours
      setShowChoiceModal(false);
    } else {
      alert("Failed to drop employee.");
    }
  } catch (err) {
    console.error(err);
  }
};

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

            <button className="sidebar-btn createEmp" onClick={() => setShowChoiceModal(true)}>
  <Image src="/svg/createEmp.svg" alt="Add/Drop" width={32} height={32}/>
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

      {showChoiceModal && (
  <div className="modalOverlay" onClick={() => setShowChoiceModal(false)}>
    <div className="modalBox" onClick={e => e.stopPropagation()} style={{ width: '350px', textAlign: 'center' }}>
      <h3>Manage Team</h3>
      <p style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.8 }}>
        Would you like to add a new member or remove the currently selected employee?
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          className="assignBtn" 
          onClick={() => { setComposeMode("invite"); setShowChoiceModal(false); }}
        >
          Add New Employee (Send Invite)
        </button>
        
        <button 
  className="assignBtn" 
  style={{ background: '#e53e3e', opacity: 1, cursor: 'pointer' }} // Remove disabled styling
  onClick={() => {
    if (!selectedEmp) {
      // If no one is selected, close choice modal and open selection popup
      setShowChoiceModal(false);
      setShowPopup(true); 
    } else {
      handleDropEmployee();
    }
  }}
>
  {selectedEmp ? `Drop ${selectedEmp.name}` : "Select an employee to Drop"}
</button>
        
        <button 
          style={{ background: 'transparent', border: 'none', color: 'gray', marginTop: '10px', cursor: 'pointer' }} 
          onClick={() => setShowChoiceModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

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
