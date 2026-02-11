"use client";


import { useState, useEffect } from "react";
import "./Cobox.css";
import { supabase } from "@/lib/supabaseClient";



interface IMessage {
  id: string;
  sender_email: string;
  receiver_email: string;
  subject: string;
  body: string;
  type: "message" | "invite";
  status: "pending" | "accepted" | "declined" | "read";

  created_at: string;
}

export default function InboxView() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [view, setView] = useState<"menu" | "list">("menu");
  const [activeCategory, setActiveCategory] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMsg, setSelectedMsg] = useState<IMessage | null>(null);

  

  /* ===================== AUTH ===================== */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  /* ===================== LOAD MESSAGES ===================== */
  useEffect(() => {
    if (!userEmail) return;

    supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Inbox load error:", error.message);
          return;
        }
        setMessages(data ?? []);
      });
  }, [userEmail]);

  /* ===================== FILTERING ===================== */
  const filteredMessages = messages
    .filter((m) => {
      if (!userEmail) return false;

      const isSent = m.sender_email === userEmail;
      const isInvite = m.type === "invite";

      if (activeCategory === "inv_sent") return isSent && isInvite;
      if (activeCategory === "inv_rec") return !isSent && isInvite;
      if (activeCategory === "msg_sent") return isSent && !isInvite;
      if (activeCategory === "msg_rec") return !isSent && !isInvite;

      return false;
    })
    .filter((m) =>
      m.subject.toLowerCase().includes(search.toLowerCase())
    );

  /* ===================== ACTIONS ===================== */
  async function acceptInvite(msg: IMessage) {
  try {
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msg.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to accept invite");
      return;
    }

    // update local UI
    setMessages(prev =>
      prev.map(m =>
        m.id === msg.id ? { ...m, status: "accepted" } : m
      )
    );

    setSelectedMsg(prev =>
      prev ? { ...prev, status: "accepted" } : null
    );

    alert("Invitation accepted!");
  } catch (err) {
    alert("Network error");
  }
}


  async function declineInvite(msg: IMessage) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch("/api/invites/decline", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ messageId: msg.id }),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }

  // update list
  setMessages(prev =>
    prev.map(m =>
      m.id === msg.id ? { ...m, status: "declined" } : m
    )
  );

  // update detail view
  setSelectedMsg(prev =>
    prev ? { ...prev, status: "declined" } : null
  );
}



  /* ===================== MENU VIEW ===================== */
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
            onClick={() => {
              setActiveCategory(cat.id);
              setView("list");
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="taskText">{cat.label}</div>
            <div className="container2" />
          </div>
        ))}
      </div>
    );
  }

  /* ===================== LIST VIEW ===================== */
  return (
    <div className="coboxContainer">
      <div className="cobox">
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px", width: "90%" }}>
          <button
            className="action-btn"
            onClick={() => {
              setView("menu");
              setSelectedMsg(null);
            }}
          >
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
              key={m.id}
              className={`container3 ${
                selectedMsg?.id === m.id ? "active-card" : ""
              }`}
              onClick={() => setSelectedMsg(m)}
              style={{ cursor: "pointer" }}
            >
              <div className="taskText">
                {m.subject}
                <br />
                <span>
                  {m.sender_email === userEmail
                    ? `To: ${m.receiver_email}`
                    : `From: ${m.sender_email}`}
                </span>
                <small style={{ display: "block", fontSize: "11px", opacity: 0.6 }}>
                  {new Date(m.created_at).toLocaleString()}
                </small>
              </div>
            </div>
          ))
        ) : (
          <p className="select-prompt" style={{ textAlign: "center", marginTop: "20px" }}>
            No messages found.
          </p>
        )}
      </div>

      {/* ===================== DETAIL VIEW ===================== */}
      <div className="taskDescription">
        {selectedMsg ? (
          <div className="description-content">
            <h2 style={{ color: "white" }}>{selectedMsg.subject}</h2>
            <hr style={{ opacity: 0.2, margin: "15px 0" }} />

            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
              <strong>From:</strong> {selectedMsg.sender_email}
            </p>

            <p
              style={{
                whiteSpace: "pre-wrap",
                marginTop: "20px",
                lineHeight: "1.6",
                color: "white",
              }}
            >
              {selectedMsg.body}
            </p>

            {selectedMsg.type === "invite" &&
              selectedMsg.receiver_email === userEmail &&
              selectedMsg.status === "pending" && (
                <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
                  <button className="assignBtn" onClick={() => acceptInvite(selectedMsg)}>
                    Accept
                  </button>
                  <button
                    className="assignBtn"
                    style={{ background: "rgb(239, 68, 68)" }}
                    onClick={() => declineInvite(selectedMsg)}
                  >
                    Decline
                  </button>
                </div>
              )}

            {selectedMsg.status === "accepted" && (
              <div style={{ marginTop: "20px", color: "#4dff9a" }}>
                ✓ Invitation Accepted
              </div>
            )}

            {selectedMsg.status === "declined" && (
              <div style={{ marginTop: "20px", color: "#ff4d4d" }}>
                ✕ Invitation Declined
              </div>
            )}
          </div>
        ) : (
          <p className="select-promptMessage">
            Select a message to view content.
          </p>
        )}
      </div>
      
    </div>
  );
}
