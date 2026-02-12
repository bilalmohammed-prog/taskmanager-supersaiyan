"use client";

import ComposeMessagePopup from "./ComposeMessagePopup";

import Image from "next/image";


import  SwitchEmpPopup from "./switchEmpPopup";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

import { usePathname } from "next/navigation";
import { useDashboard } from "./Context/DashboardContext";

import { Button } from "./ui/button";

export default function TopBar() {

    const pathname = usePathname();

    const [userEmail, setUserEmail] = useState<string | null>(null);

    const topbarCls = `
  fixed top-0 left-0 right-0
  h-13
  grid grid-cols-[1fr_auto_auto_1fr]
  items-center
  bg-[#1E1E1E]
  border-b border-white/25
  px-4
  z-[1000]
`;

  
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
  const [authChecked, setAuthChecked] = useState(false);


useEffect(() => {
  async function loadUser(): Promise<void> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Failed to load session:", error.message);
      setAuthChecked(true);
      return;
    }

    if (session?.user?.email) {
      setUserEmail(session.user.email);
    }

    setAuthChecked(true);
  }

  loadUser();
}, []);




if (!authChecked) return null;


const handleDropEmployee = async () => {
  if (!selectedEmp) return alert("Please select an employee to drop first.");

  const confirmDrop = confirm(
    `Are you sure you want to remove ${selectedEmp.name} from your team?`
  );
  if (!confirmDrop) return;
const { data: { user } } = await supabase.auth.getUser();
console.log("Logged in user:", user);

  try {
    // 1️⃣ Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Not logged in");
      return;
    }

    // 2️⃣ Send token
    const res = await fetch(`/api/invites/drop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: selectedEmp.id }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Employee dropped successfully.");
      setSelectedEmp(null);
      setShowChoiceModal(false);
    } else {
      alert(data.error || "Failed to drop employee.");
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
    userEmail={userEmail ?? ""
} 
    currentManagerID={currentManagerID} 
    fixedType="invite" 
    onClose={() => setComposeMode(null)} 
  />
)}

        {showPopup && (
  <SwitchEmpPopup
    onClose={() => setShowPopup(false)}
    onSelect={(emp) => {
      setSelectedEmp(emp);
      setShowPopup(false);
    }}
    selectedEmpID={selectedEmp?.id || null}
  />
)}


        <div className={topbarCls}>

          <div className="
  col-[2]
  flex items-center justify-center
  gap-3
">


            <Button variant="topbar" onClick={() => setShowChoiceModal(true)}>
  <Image src="/svg/createEmp.svg" alt="Create Employee" width={22} height={22}/>
  Add / Drop Employee
</Button>


<Button variant="topbar" onClick={() => setShowPopup(true)}>
  <Image src="/svg/switchEmp.svg"
  alt="Select Employee" 
  width={22} 
  height={22}/>
  Select Employee
</Button>


            <Button
  variant="topbar"
  
  disabled={!selectedEmp}
  onClick={() => {
    if (!selectedEmp) return alert("Select an employee first");
    setOpenAssignModal(true);
  }}
>
  <Image src="/svg/assignTask.svg" alt="Assign Task" width={22} height={22}/>
  Add Task
</Button>




            


            <Button
  variant="topbar"
  disabled={!selectedEmp}
  onClick={() => {
    setSelectedEmp(null);
    setOpenAssignModal(false);
  }}
>
  <Image src="/svg/endDay.svg" alt="End Day" width={22} height={22}/>
  Assign Tasks
</Button>


          </div>

          <div className="
  col-[4]
  justify-self-end
  text-white
  text-[16px]
  whitespace-nowrap
">
<div className="col-[2] flex justify-center">

  {selectedEmp ? (
    <>
      <span style={{ fontWeight: 500, color: '#ffffff' }}>{selectedEmp.name}</span>
      <span style={{ color: 'rgba(255,255,255,0.65)', margin: '0 6px', fontSize: '0.92em' }}>
        ({selectedEmp.emp_id})
      </span>
    </>
  ) : (
    <span style={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
      No employee selected
    </span>
  )}
</div>
</div>

        </div>

      {showChoiceModal && (
  <div
  className="
    fixed inset-0
    bg-black/60
    backdrop-blur-sm
    flex items-center justify-center
    z-[2000]
  "
  onClick={() => setShowChoiceModal(false)}
>

    <div
  className="
    w-[90%] max-w-[420px]
    bg-[#1e1e1e]
    border border-white/15
    rounded-xl
    p-6
    shadow-2xl
    text-white
    flex flex-col gap-3
  "
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
          ? `What would you like to do with ${selectedEmp.name} (${selectedEmp.emp_id})?`
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
  
  <div className={topbarCls}>

            
            
            
<div className="
  col-[4]
  justify-self-end
  text-white
  text-[16px]
  whitespace-nowrap
">
<span className="whitespace-nowrap">
</span>
        
    </div>
        </div>
  );
    

  
  if (isProgress)
    
    return (
  
  <div className={topbarCls}>

            
            
            
<div className="
  col-[4]
  justify-self-end
  text-white
  text-[16px]
  whitespace-nowrap
">
<span className="whitespace-nowrap">
</span>
        
    </div>
        </div>
  );
    


  if (isInbox) {
    return (
      <div className={topbarCls}>

        {composeMode && (
  <ComposeMessagePopup 
    userEmail={userEmail ?? ""}
    currentManagerID={currentManagerID} 
    fixedType={composeMode} 
    onClose={() => setComposeMode(null)} 
  />
)}

        <Button variant="topbar" onClick={() => setComposeMode("message")}>
  <Image src="/svg/draft.svg" alt="Draft" width={22} height={22}/>
  Draft
</Button>



        <div className="
  col-[4]
  justify-self-end
  text-white
  text-[16px]
  whitespace-nowrap
">
<span className="whitespace-nowrap">
</span>
        </div>
      </div>
    );
  }
  


  return null;
}
