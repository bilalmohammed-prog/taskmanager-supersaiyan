"use client";

import { useState, ChangeEvent, useEffect } from "react";

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
  fixedType: "message" | "invite"; // New Prop
};

export default function ComposeMessagePopup({ userEmail, currentManagerID, onClose, fixedType }: Props) {
  const [form, setForm] = useState<IMessageForm>({
    receiverEmail: "",
    subject: fixedType === "invite" ? "Manager Invitation" : "", // Pre-fill subject for invites
    body: "",
    type: fixedType // Initialize with fixed type
  });

  const [isSending, setIsSending] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!userEmail) return alert("Session expired. Please login again.");
    if (!form.receiverEmail || !form.subject || !form.body) {
      return alert("All fields are required");
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          senderEmail: userEmail,
          managerID: form.type === "invite" ? currentManagerID : null,
        })
      });

      if (res.ok) {
        alert(form.type === "invite" ? "Invitation sent!" : "Message sent!");
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send");
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modalBox" style={{ width: '450px', background: 'white', color: '#1a1d23' }}>
        <h3 style={{ marginBottom: '15px', fontWeight: 600 }}>
          {fixedType === "invite" ? "Invite Employee" : "New Message"}
        </h3>
        
        {/* The Category Select is removed to make it "unchangeable" */}

        <input 
          name="receiverEmail"
          placeholder="Recipient Gmail" 
          value={form.receiverEmail} 
          onChange={handleInputChange}
          style={{ color: '#1a1d23', border: '1px solid #cbd5e0', marginBottom: '10px', padding: '10px', width: '100%', borderRadius: '4px' }}
        />
        
        <input 
          name="subject"
          placeholder="Subject" 
          value={form.subject} 
          onChange={handleInputChange}
          style={{ color: '#1a1d23', border: '1px solid #cbd5e0', marginBottom: '10px', padding: '10px', width: '100%', borderRadius: '4px' }}
        />

        <textarea 
          name="body"
          placeholder={fixedType === "invite" ? "Include a note with your invitation..." : "Type your message..."} 
          value={form.body} 
          onChange={handleInputChange} 
          style={{ minHeight: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', width: '100%', fontFamily: 'inherit', color: '#1a1d23' }}
        />

        <div className="row" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="cancel-btn-style">Cancel</button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSending}
            style={{ background: '#4a6df3', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: isSending ? 'not-allowed' : 'pointer' }}
          >
            {isSending ? "Sending..." : fixedType === "invite" ? "Send Invite" : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
}