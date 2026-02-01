"use client";

import { useEffect,useState, ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
interface IMessageForm {
  receiverEmail: string;
  subject: string;
  body: string;
  type: "message" | "invite";
}

type Props = {
  userEmail: string;
  currentManagerID: string | null;
  onClose: () => void;
  fixedType: "message" | "invite";
};

export default function ComposeMessagePopup({
  userEmail,
  currentManagerID,
  onClose,
  fixedType,
}: Props) {
  const [form, setForm] = useState<IMessageForm>({
    receiverEmail: "",
    subject: fixedType === "invite" ? "Manager Invitation" : "",
    body: "",
    type: fixedType,
  });

  const [isSending, setIsSending] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ===================== SEND MESSAGE ===================== */
  

  const handleSubmit = async () => {
  if (!userEmail) {
    alert("Session expired. Please login again.");
    return;
  }

  if (!form.receiverEmail || !form.subject || !form.body) {
    alert("All fields are required");
    return;
  }

  setIsSending(true);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Session expired");
      return;
    }

    const senderId = session.user.id; // 🔥 THIS IS THE MANAGER

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        receiverEmail: form.receiverEmail,
        subject: form.subject,
        body: form.body,
        type: form.type,
        manager_id: form.type === "invite" ? senderId : null, // 🔥 KEY LINE
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to send");
      return;
    }

    alert(
      form.type === "invite"
        ? "Invitation sent!"
        : "Message sent!"
    );

    onClose();
  } catch {
    alert("Network error. Please try again.");
  } finally {
    setIsSending(false);
  }
};


  /* ===================== UI ===================== */
  return (
    <div
      className="modalOverlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modalBox">
        <h3>
          {fixedType === "invite" ? "Invite Employee" : "New Message"}
        </h3>

        <input
          name="receiverEmail"
          placeholder="Recipient Gmail"
          value={form.receiverEmail}
          onChange={handleInputChange}
        />

        <input
          name="subject"
          placeholder="Subject"
          value={form.subject}
          onChange={handleInputChange}
        />

        <textarea
          name="body"
          placeholder={
            fixedType === "invite"
              ? "Include a note with your invitation..."
              : "Type your message..."
          }
          value={form.body}
          onChange={handleInputChange}
          style={{
            width: "95%",
            minHeight: "150px",
            padding: "8px",
            marginTop: "10px",
            marginBottom: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: "transparent",
            color: "inherit",
            display: "block",
            resize: "vertical",
          }}
        />

        <div className="row">
          <button type="button" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSending}
          >
            {isSending
              ? "Sending..."
              : fixedType === "invite"
              ? "Send Invite"
              : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
