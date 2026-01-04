"use client";

import "./switchEmpPopup.css";
import {useState, useEffect} from "react";

type Employee = {
  empID: string;
  name:string;
};


export default function SwitchEmpPopup({
  onClose,
  onSelect,
  selectedEmpID,
  currentManagerID
}: {
  onClose: () => void;
  onSelect: (emp: { name: string; empID: string }) => void;
  selectedEmpID: string | null;
  currentManagerID: string | null;
}) {

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

  async function loadEmployees() {
    if (!currentManagerID) return;
    try {
      setLoading(true);
      const res = await fetch("/api/switchEmp?managerID=" + currentManagerID);
      const data = await res.json();
      setEmployees(data.employees);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setLoading(false);
    }
  }

  function choose(empID: string, name: string) {
    onSelect({ empID, name });
    console.log("Switched to employee:", empID);
    // TODO: save employee in global state OR context
    onClose();
  }

  useEffect(() => {
    loadEmployees();
  }, [currentManagerID]);

    return (
  <div className="switch-emp-modal-overlay active" id="switchEmpModalOverlay">
    <div className="switch-emp-modal" role="dialog" aria-labelledby="switchEmpModalTitle" aria-modal="true">
        {/* <!-- Close Button --> */}
        <button className="switch-emp-modal-close" id="closeSwitchEmpModalBtn" aria-label="Close modal"
        onClick={onClose}
        >×</button>

        {/* <!-- Modal Header --> */}
        <div className="switch-emp-modal-header">
            <h2 className="switch-emp-modal-title" id="switchEmpModalTitle">Select Employee</h2>
            

        
            
        </div>

        {/* <!-- Employee List Container --> */}
        <div className="switch-emp-list-container">

  {loading && (
    <div className="switch-emp-loading">
      <div className="switch-emp-spinner"></div>
      <p>Loading employees...</p>
    </div>
  )}

  {!loading && employees.length === 0 && (
    <div className="switch-emp-empty">
      <p>No employees found</p>
    </div>
  )}

  {!loading && employees.length > 0 && (
    <div className="switch-emp-grid">
  {employees.map(e => (
    <div
      key={e.empID}
      className={`switch-emp-card ${
        selectedEmpID === e.empID ? "selected" : ""
      }`}
      onClick={() => onSelect({ empID: e.empID, name: e.name })}
    >
      <div className="switch-emp-card-name">{e.name}</div>
      <div className="switch-emp-card-id">ID: {e.empID}</div>
    </div>
  ))}
</div>

  )}

</div>



            {/* <!-- Inbox Modal --> */}
            <div className="inbox-modal-overlay" id="inboxModalOverlay" style={{display:"none", position:"fixed", inset:"0", background:"rgba(0,0,0,0.5)", zIndex:"1000"}}>
                <div className="inbox-modal" role="dialog" aria-labelledby="inboxTitle" aria-modal="true" style={{width:"90%", maxWidth:"720px", margin:"60px auto", background:"#fff", borderRadius:"8px", padding:"16px", boxShadow:"0 8px 24px rgba(0,0,0,0.3)"}}>
                    <button id="closeInboxModalBtn" aria-label="Close inbox" style={{float:"right", background:"none", border:"none", fontSize:"20px"}}>×</button>
                    <h2 id="inboxTitle">Inbox</h2>
                    <p style={{color:"#666", marginTop:"6px"}}>Pending invitations and notifications</p>

                    <div style={{display:"flex", gap:"12px", marginTop:"12px"}}>
                        <div style={{flex:"1", minWidth:"240px"}}>
                            <h3 style={{margin:"6px 0 8px"}}>Received Invitations</h3>
                            <div id="inboxReceivedList" style={{maxHeight:"320px", overflow:"auto", border:"1px solid #eee", padding:"8px", borderRadius:"6px", background:"#fafafa"}}>Loading...</div>
                        </div>
                        <div style={{flex:"1", minWidth:"240px"}}>
                            <h3 style={{margin:"6px 0 8px"}}>Sent Invitations</h3>
                            <div id="inboxSentList" style={{maxHeight:"320px", overflow:"auto", border:"1px solid #eee", padding:"8px", borderRadius:"6px", background:"#fafafa"}}>Loading...</div>
                        </div>
                    </div>

                    <div id="inboxFooter" style={{margin:"12px 0 0", textAlign:"right"}}>
                        <button id="inboxRefreshBtn" style={{padding:"8px 12px"}}>Refresh</button>
                    </div>
                </div>
            </div>

        {/* <!-- Empty state --> */}
        <div className="switch-emp-empty" id="switchEmpEmpty" style={{display: "none"}}>
            <p>No employees found</p>
        </div>
    </div>
</div>
    );
}
