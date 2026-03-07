"use client";

import "./Cobox.css";

export default function InboxView() {
  return (
    <div className="coboxContainer">
      <div className="cobox">
        <p className="select-prompt" style={{ textAlign: "center", marginTop: "20px" }}>
          Messaging is not available yet
        </p>
      </div>

      <div className="taskDescription">
        <p className="select-promptMessage">Messaging is not available yet</p>
      </div>
    </div>
  );
}