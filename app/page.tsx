"use client";
import Image from "next/image";
export default function Page() {
  return (
    <>
      <div>
    <div className="overlay"></div>
    <div className="popup">
        <p className="pt">Task Evaluation</p>
        <button className="confirm">Confirm</button>
        <button className="cancel">X</button>
        <div className="popupscroll">
            <p className="taskStatus"></p>
        </div>
        <div className="reason_popup">
        <input type='text' className="reason_input" placeholder='Enter your reason here...' />
        <button className="rconfirm">Confirm</button>
        <button className="rcancel">X</button>
    </div>
    
    <div className="AIeval"><h1 className="AIh">AI Evaluation</h1><p className="AIp"></p></div>
    </div>
    
    
    
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
        <div className="cobox">
            
        </div>

        
    
    <div className="record_popup">
        <p className="record_title">All Collections Data</p>
        <button className="record_cancel">X</button>
        <div className="record_scroll">
            <p className="record_content"></p>
        </div>
    </div>


    


    <div className="assign-modal-overlay" id="assignModalOverlay">
    <div className="assign-modal" role="dialog" aria-labelledby="assignModalTitle" aria-modal="true">
        {/* <!-- Close Button --> */}
        <button className="assign-modal-close" id="closeAssignModalBtn" aria-label="Close modal">×</button>

        {/* <!-- Modal Header --> */}
        <div className="assign-modal-header">
            <h2 className="assign-modal-title" id="assignModalTitle">Assign New Task</h2>
            <p className="assign-modal-subtitle">Fill in the details to assign a task to an employee</p>
        </div>

        {/* <!-- Form --> */}
        <form id="assignTaskForm">
            {/* <!-- Task Description --> */}
            <div className="assign-form-group">
                <label htmlFor="assignTaskInput" className="assign-form-label">Task Description *</label>
                <textarea 
                    id="assignTaskInput" 
                    className="assign-form-textarea" 
                    placeholder="Enter task details..."
                    required
                    aria-required="true"
                ></textarea>
                <span className="assign-validation-message" id="assignTaskValidation">Task description is required</span>
            </div>

            {/* <!-- Time Range --> */}
            <div className="assign-form-group">
  <label className="assign-form-label">Start Time *</label>
  <input 
    type="datetime-local" 
    id="assignStartInput" 
    className="assign-form-input"
   
  />

  <label className="assign-form-label" style={{marginTop:"8px"}}>End Time *</label>
  <input 
    type="datetime-local" 
    id="assignEndInput" 
    className="assign-form-input"
    
  />

</div>


            {/* <!-- Action Buttons --> */}
            <div className="assign-modal-actions">
                <button type="button" className="assign-btn assign-btn-cancel" id="assignCancelBtn">Cancel</button>
                <button type="submit" className="assign-btn assign-btn-ok" id="assignOkBtn" disabled>Assign Task</button>
            </div>
        </form>
    </div>
</div>


{/* <!-- Switch Employee Modal --> */}
<div className="switch-emp-modal-overlay" id="switchEmpModalOverlay">
    <div className="switch-emp-modal" role="dialog" aria-labelledby="switchEmpModalTitle" aria-modal="true">
        {/* <!-- Close Button --> */}
        <button className="switch-emp-modal-close" id="closeSwitchEmpModalBtn" aria-label="Close modal">×</button>

        {/* <!-- Modal Header --> */}
        <div className="switch-emp-modal-header">
            <h2 className="switch-emp-modal-title" id="switchEmpModalTitle">Select Employee</h2>
            <p className="switch-emp-modal-subtitle">Choose an employee to switch to</p>
        </div>

        {/* <!-- Employee List Container --> */}
        <div className="switch-emp-list-container" id="switchEmpListContainer">
            {/* <!-- Loading state --> */}
            <div className="switch-emp-loading" id="switchEmpLoading">
                <div className="switch-emp-spinner"></div>
                <p>Loading employees...</p>
            </div>

            {/* <!-- Error state --> */}
            <div className="switch-emp-error" id="switchEmpError" style={{display: "none"}}>
                <p>Failed to load employees. Please try again.</p>
                <button className="switch-emp-retry-btn" id="switchEmpRetryBtn">Retry</button>
            </div>

            {/* <!-- Employee list (dynamically populated) --> */}
            <div className="switch-emp-list" id="switchEmpList">
                {/* <!-- Employee items will be inserted here dynamically --> */}
            </div>
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

        {/* <!-- Action Buttons --> */}
        <div className="switch-emp-modal-actions">
            <button type="button" className="switch-emp-btn switch-emp-btn-cancel" id="switchEmpCancelBtn">Cancel</button>
        </div>
    </div>
</div>
{/* ================= DRAFT MESSAGE POPUP ================= */}
<div className="draft-modal-overlay" id="draftModalOverlay">
  <div className="draft-modal">
    <button className="draft-modal-close" id="closeDraftModalBtn">×</button>

    <h2 className="draft-title">Draft Message</h2>

    <label className="draft-label">Employee ID</label>
    <input type="text" id="draftEmpID" className="draft-input" placeholder="Enter employee ID" />

    <label className="draft-label">Message</label>
    <textarea id="draftMessage" className="draft-textarea" placeholder="Write your message..."></textarea>

    <div className="draft-actions">
      <button className="draft-btn draft-cancel" id="draftCancelBtn">Cancel</button>
      <button className="draft-btn draft-send" id="draftSendBtn">Send</button>
    </div>
  </div>
</div>
<div className="profile-dropdown" id="profileDropdown">
        <div className="profile-name" id="profileName">User Name</div>
        <div className="profile-id" id="profileID">ID: -</div>
        <div className="profile-email" id="profileEmail">Email: -</div>

        {/* <button className="logout-btn" onclick="app1.logout()">Logout</button> */}
      </div>
    
</div>
    </>
  );
}
