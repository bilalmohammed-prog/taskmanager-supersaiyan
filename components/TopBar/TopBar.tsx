"use client";

import ComposeMessagePopup from "../Popups/ComposeMessagePopup/ComposeMessagePopup";

import Image from "next/image";
import "./TopBar.css";

import  SwitchEmpPopup from "../Popups/switchEmpPopup/switchEmpPopup";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useDashboard } from "../Context/DashboardContext";



export default function TopBar() {

    const pathname = usePathname();

    const { data: session } = useSession();

    const {
    selectedEmp,
    setSelectedEmp,
    setOpenAssignModal,
    currentManagerID
  } = useDashboard();

    const [showPopup, setShowPopup] = useState(false);
    
  const [composeMode, setComposeMode] = useState<"message" | "invite" | null>(null);

  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const isTeamTasks = pathname.startsWith("/teamTasks");
  const isInbox = pathname.startsWith("/inbox");
  const isTasks = pathname.startsWith("/userTasks");
  const isProgress = pathname.startsWith("/progress");

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

  if (isTeamTasks)
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

            <button className="createEmp" onClick={() => setShowChoiceModal(true)}>
  <Image src="/svg/createEmp.svg" alt="Add/Drop" width={32} height={32}/>
  Add / Drop Employee
  {/* <span className="tooltip">Add/Drop employee</span> */}
  
</button>
{/* <span className="btn-label">Manage Staff</span> */}

<button className="sidebar-btn switchEmp" onClick={() => setShowPopup(true)}>
              <Image src="/svg/switchEmp.svg" alt="Draft icon" width={32} height={32}/>
              Select Employee
              <span className="tooltip">Switch employee</span>
            </button>

            <button
  className="sidebar-btn assign-task-btn"
  disabled={!selectedEmp}
  
  onClick={() => {
    if (!selectedEmp) {
      alert("Select an employee first");
      return;
    }
    setOpenAssignModal(true);
  }}
>
  <Image src="/svg/assignTask.svg" alt="Draft icon" width={32} height={32}/>
  Add Task
  {/* <span className="tooltip">Add task</span> */}
</button>



            


            <button className="sidebar-btn endDay" 
            disabled={!selectedEmp}
  onClick={() => {
    setSelectedEmp(null);      // remove employee selection
    setOpenAssignModal(false); // close assign modal if open
  }}>
              <Image src="/svg/endDay.svg" alt="Draft icon" width={32} height={32}/>
              Assign Tasks
              {/* <span className="tooltip">Assign</span> */}
            </button>


          </div>

          <div className="empBarInfo">
  <span className="empDisplay">
  {selectedEmp ? (
    <>
      <span style={{ fontWeight: 500, color: '#ffffff' }}>{selectedEmp.name}</span>
      <span style={{ color: 'rgba(255,255,255,0.65)', margin: '0 6px', fontSize: '0.92em' }}>
        ({selectedEmp.empID})
      </span>
    </>
  ) : (
    <span style={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
      No employee selected
    </span>
  )}
</span>
</div>

        </div>

      {showChoiceModal && (
  <div 
    className="modalOverlay" 
    onClick={() => setShowChoiceModal(false)}
  >
    <div 
      className="modalBox"
      onClick={e => e.stopPropagation()}
    >
      <h3 style={{ margin: '0 0 12px 0' }}>
        Manage Team Member
      </h3>

      <p style={{ 
        margin: '0 0 20px 0', 
        fontSize: '14px', 
        color: 'rgba(255,255,255,0.75)',
        lineHeight: '1.45'
      }}>
        {selectedEmp 
          ? `What would you like to do with ${selectedEmp.name} (${selectedEmp.empID})?`
          : "Choose an action to manage your team members."
        }
      </p>

      {/* Warning for destructive action - only shown when someone is selected */}
      {selectedEmp && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          borderLeft: '4px solid #ef4444',
          padding: '12px 16px',
          borderRadius: '8px',
          margin: '0 0 20px 0',
          fontSize: '13.5px',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span>
            Removing an employee will revoke their access and archive their tasks. 
            This action cannot be undone.
          </span>
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Add New Employee Button */}
        <button
          className="assignBtn"
          style={{
            background: '#3b82f6',
            color: 'white',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: 500,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => {
            setComposeMode("invite");
            setShowChoiceModal(false);
          }}
        >
          ➕ Add New Employee (Send Invite)
        </button>

        {/* Drop / Select Employee Button */}
        <button
          className="assignBtn"
          style={{
            background: selectedEmp ? '#ef4444' : '#444',
            color: 'white',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: 500,
            fontSize: '14px',
            border: 'none',
            cursor: selectedEmp ? 'pointer' : 'not-allowed',
            opacity: selectedEmp ? 1 : 0.6
          }}
          disabled={!selectedEmp}
          onClick={() => {
            if (!selectedEmp) {
              setShowChoiceModal(false);
              setShowPopup(true); // open employee selector
              return;
            }
            handleDropEmployee();
          }}
        >
          {selectedEmp 
            ? `🗑️ Remove ${selectedEmp.name}` 
            : "Select an employee first to remove"
          }
        </button>

        {/* Cancel */}
        <button
          onClick={() => setShowChoiceModal(false)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#aaa',
            padding: '10px',
            borderRadius: '10px',
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      </>
    );
  


  
  if (isTasks)
    
    return (
  
  <div className="rsidebar">
            
            
            
<div className="empBarInfo">
        <span className="empDisplay"></span>
        
    </div>
        </div>
  );
    

  
  if (isProgress)
    
    return (
  
  <div className="rsidebar">
            
            
            
<div className="empBarInfo">
        <span className="empDisplay"></span>
        
    </div>
        </div>
  );
    


  if (isInbox) {
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
          Draft
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
