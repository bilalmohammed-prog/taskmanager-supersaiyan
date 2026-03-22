"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  created_at: string;
  project_id: string | null;
};

export default function InboxView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        const res = await apiFetch("/api/messages");
        const json = await res.json();
        setMessages(json?.data?.messages ?? json?.messages ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="flex h-[calc(100vh-52px)] overflow-hidden">
      {/* Message list */}
      <div className="w-[320px] flex-shrink-0 border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
        </div>

        {loading && (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        )}

        {error && (
          <p className="p-4 text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && messages.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No messages yet.</p>
        )}

        {!loading &&
          messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setSelected(msg)}
              className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                selected?.id === msg.id ? "bg-accent" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground truncate">
                From: {msg.sender_id.slice(0, 8)}…
              </p>
              <p className="text-sm text-foreground mt-1 line-clamp-2">
                {msg.content}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(msg.created_at)}
              </p>
            </div>
          ))}
      </div>

      {/* Message detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <div className="max-w-2xl space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                From: {selected.sender_id}
              </p>
              {selected.recipient_id && (
                <p className="text-xs text-muted-foreground">
                  To: {selected.recipient_id}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDate(selected.created_at)}
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {selected.content}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Select a message to read
            </p>
          </div>
        )}
      </div>
    </div>
  );
}