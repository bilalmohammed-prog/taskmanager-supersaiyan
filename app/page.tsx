"use client";
import ClientLayout from "../components/ClientLayout";
export default function Page() {

  

  return (
    <ClientLayout>
    
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
    </ClientLayout>
  );
}
