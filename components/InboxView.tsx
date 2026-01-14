"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import "./Cobox/Cobox.css"; // reuse styles if needed
import { useDashboard } from "./Context/DashboardContext";
import { useSession } from "next-auth/react";

interface IMessage {
  _id: string;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  body: string;
  type: "message" | "invite";
  status: "pending" | "accepted" | "declined" | "read";
  managerID?: string;
  createdAt: string | Date;
}





export default function InboxView() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [view, setView] = useState<"menu" | "list">("menu");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedMsg, setSelectedMsg] = useState<IMessage | null>(null);

  const declineInvite = async (msg: IMessage) => {
  const confirmDecline = confirm("Are you sure you want to decline this invitation?");
  if (!confirmDecline) return;

  try {
    const res = await fetch(`/api/invites/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg._id }),
    });

    if (res.ok) {
      alert("Invitation declined.");
      
      // 1. Update the list so the state is consistent
      setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: "declined" } : m));
      
      // 2. IMPORTANT: Update the currently viewed message so the buttons disappear
      setSelectedMsg({ ...msg, status: "declined" });
    } else {
      const errorData = await res.json();
      alert(`Error: ${errorData.error || "Could not decline"}`);
    }
  } catch (err) {
    console.error("Error declining invite:", err);
  }
};

  useEffect(() => {
    if (userEmail) {
      fetch(`/api/messages?email=${userEmail}`)
        .then((res) => res.json())
        .then((data: IMessage[]) => setMessages(data))
        .catch((err) => console.error("Inbox load error:", err));
    }
  }, [userEmail]);

  // Filtering Logic with type safety
  const filteredMessages = messages.filter((m) => {
    if (!userEmail) return false;
    
    const isSent = m.senderEmail === userEmail;
    const isInvite = m.type === "invite";
    
    if (activeCategory === "inv_sent") return isSent && isInvite;
    if (activeCategory === "inv_rec") return !isSent && isInvite;
    if (activeCategory === "msg_sent") return isSent && !isInvite;
    if (activeCategory === "msg_rec") return !isSent && !isInvite;
    return false;
  }).filter((m) => m.subject.toLowerCase().includes(search.toLowerCase()));

  const acceptInvite = async (msg: IMessage) => {
    if (!msg.managerID) return alert("Invalid Invite: No Manager ID found.");
    
    try {
      const res = await fetch(`/api/invites/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messageId: msg._id, 
          managerID: msg.managerID,
          empEmail: userEmail 
        }),
      });

      if (res.ok) {
        alert("Invitation accepted! You are now linked to your manager.");
        // Update local state to show 'accepted'
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: "accepted" } : m));
        setSelectedMsg(prev => prev ? { ...prev, status: "accepted" } : null);
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  if (view === "menu") {
    return (
      <div className="coboxContainer" style={{ gap: "30px" }}>
        {[
          { id: "inv_sent", label: "Invitations Sent" },
          { id: "inv_rec", label: "Invitations Received" },
          { id: "msg_sent", label: "Messages Sent" },
          { id: "msg_rec", label: "Messages Received" },
        ].map((cat) => (
          <div 
            key={cat.id} 
            className="container3 container3Message" 
            onClick={() => { setActiveCategory(cat.id); setView("list"); }}
            style={{ cursor: "pointer" }}
          >
            <div className="taskText">{cat.label}</div>
            <div className="container2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="coboxContainer">
      <div className="cobox">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', width: '90%' }}>
          <button className="action-btn" onClick={() => { setView("menu"); setSelectedMsg(null); }}>
            ←
          </button>
          <input 
            className="edit-input" 
            placeholder="Search subject..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        {filteredMessages.length > 0 ? (
          filteredMessages.map((m) => (
            <div 
              key={m._id} 
              className={`container3 ${selectedMsg?._id === m._id ? "active-card" : ""}`} 
              onClick={() => setSelectedMsg(m)}
              style={{ cursor: "pointer" }}
            >
              <div className="taskText">
                {m.subject} <br />
                <span>{m.senderEmail === userEmail ? `To: ${m.receiverEmail}` : `From: ${m.senderEmail}`}</span>
                <small style={{ display: 'block', fontSize: '11px', opacity: 0.6 }}>
                  {new Date(m.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
          ))
        ) : (
          <p className="select-prompt" style={{ textAlign: 'center', marginTop: '20px' }}>No messages found.</p>
        )}
      </div>



<div className="taskDescription">
  {selectedMsg ? (
    <div className="description-content">
      <h2 style={{ color: 'white' }}>{selectedMsg.subject}</h2>
      <hr style={{ opacity: 0.2, margin: '15px 0' }} />
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
        <strong>From:</strong> {selectedMsg.senderEmail}
      </p>
      <p style={{ whiteSpace: 'pre-wrap', marginTop: '20px', lineHeight: '1.6', color: 'white' }}>
        {selectedMsg.body}
      </p>
      
      {/* Updated Buttons Block */}
      {selectedMsg.type === "invite" && 
       selectedMsg.receiverEmail === userEmail && 
       selectedMsg.status === "pending" && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '30px', width: '100%' }}>
          <button 
            className="assignBtn" 
            style={{ flex: 1, margin: 0 }} 
            onClick={() => acceptInvite(selectedMsg)}
          >
            Accept
          </button>
          
          <button 
            className="assignBtn" 
            style={{ flex: 1, margin: 0, background: 'rgb(239, 68, 68)' }} 
            onClick={() => declineInvite(selectedMsg)}
          >
            Decline
          </button>
        </div>
      )}

      {/* Dynamic Status Messages */}


{/* Dynamic Status Messages */}
{selectedMsg.status === "accepted" && (
  <div style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', background: 'rgba(77, 255, 154, 0.1)' }}>
    <p style={{ color: '#4dff9a', fontWeight: 'bold', margin: 0 }}>✓ Invitation Accepted</p>
  </div>
)}

{selectedMsg.status === "declined" && (
  <div style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', background: 'rgba(255, 77, 77, 0.1)' }}>
    <p style={{ color: '#ff4d4d', fontWeight: 'bold', margin: 0 }}>✕ Invitation Declined</p>
  </div>
)}
    </div>
  ) : (
    <p className="select-promptMessage">Select a message to view content.</p>
  )}
</div>
    </div>
  );
}