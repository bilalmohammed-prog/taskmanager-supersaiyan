"use client";

import { useState, useEffect } from "react";
import "./Cobox.css";
import { supabase } from "@/lib/supabase/client";
import { getMessages, acceptInvite, declineInvite } from "@/lib/api";
import { useToast } from "@/components/providers/toast";

interface IMessage {
  id: string;
  sender_email: string | null;
  receiver_email: string;
  subject: string;
  body: string;
  type: string;
  status: string;
  created_at: string;
}

export default function InboxView() {
  const [view, setView] = useState<"menu" | "list">("menu");
  const [activeCategory, setActiveCategory] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMsg, setSelectedMsg] = useState<IMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const { addToast } = useToast();

  

  /* ===================== AUTH ===================== */
  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email ?? null);
      } catch (err) {
        console.error("Failed to get user", err);
      }
    }
    getUser();
  }, []);


  /* ===================== LOAD MESSAGES ===================== */
  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        const msgs = await getMessages();
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to load messages", err);
        addToast("Failed to load messages", "error");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, []);


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
  async function handleAcceptInvite(msg: IMessage) {
    try {
      setActionLoading(msg.id);

      // Optimistic update
      setMessages(prev =>
        prev.map(m =>
          m.id === msg.id ? { ...m, status: "accepted" } : m
        )
      );
      setSelectedMsg(prev =>
        prev ? { ...prev, status: "accepted" } : null
      );

      await acceptInvite({ messageId: msg.id });

      addToast("Invitation accepted!", "success");
    } catch (err) {
      // Rollback on error
      setMessages(prev =>
        prev.map(m =>
          m.id === msg.id ? { ...m, status: "pending" } : m
        )
      );
      setSelectedMsg(prev =>
        prev ? { ...prev, status: "pending" } : null
      );

      console.error("Failed to accept invite", err);
      addToast("Failed to accept invite", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeclineInvite(msg: IMessage) {
    try {
      setActionLoading(msg.id);

      // Optimistic update
      setMessages(prev =>
        prev.map(m =>
          m.id === msg.id ? { ...m, status: "declined" } : m
        )
      );
      setSelectedMsg(prev =>
        prev ? { ...prev, status: "declined" } : null
      );

      await declineInvite({ messageId: msg.id });

      addToast("Invitation declined!", "success");
    } catch (err) {
      // Rollback on error
      setMessages(prev =>
        prev.map(m =>
          m.id === msg.id ? { ...m, status: "pending" } : m
        )
      );
      setSelectedMsg(prev =>
        prev ? { ...prev, status: "pending" } : null
      );

      console.error("Failed to decline invite", err);
      addToast("Failed to decline invite", "error");
    } finally {
      setActionLoading(null);
    }
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

        {loading ? (
          <p className="select-prompt" style={{ textAlign: "center", marginTop: "20px" }}>
            Loading messages...
          </p>
        ) : filteredMessages.length > 0 ? (
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
                  <button
                    className="assignBtn"
                    onClick={() => handleAcceptInvite(selectedMsg)}
                    disabled={actionLoading === selectedMsg.id}
                  >
                    {actionLoading === selectedMsg.id ? "Accepting..." : "Accept"}
                  </button>
                  <button
                    className="assignBtn"
                    style={{ background: "rgb(239, 68, 68)" }}
                    onClick={() => handleDeclineInvite(selectedMsg)}
                    disabled={actionLoading === selectedMsg.id}
                  >
                    {actionLoading === selectedMsg.id ? "Declining..." : "Decline"}
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
