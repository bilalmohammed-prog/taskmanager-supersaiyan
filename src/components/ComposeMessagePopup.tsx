"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

type Props = {
  userEmail: string;
  onClose: () => void;
  fixedType: "message" | "invite";
};

export default function ComposeMessagePopup({ onClose }: Props) {
  const [recipientId, setRecipientId] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSend() {
    if (!recipientId.trim() || !content.trim()) return;

    try {
      setSending(true);
      setError(null);

      await apiFetch("/api/messages/send", {
        method: "POST",
        body: JSON.stringify({
          recipientId: recipientId.trim(),
          content: content.trim(),
        }),
      });

      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Check the recipient ID and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[440px] space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold text-foreground">New Message</h3>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Recipient User ID
          </label>
          <input
            placeholder="Paste recipient UUID"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Message
          </label>
          <textarea
            placeholder="Write your message…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {success && (
          <p className="text-xs text-green-600">Message sent!</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!recipientId.trim() || !content.trim() || sending}
          >
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
