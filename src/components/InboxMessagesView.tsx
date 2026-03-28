"use client";

import { useState } from "react";
import type { Tables } from "@/lib/types/database";

type Message = Tables<"messages">;

export default function InboxMessagesView({
  initialMessages,
}: {
  initialMessages: Message[];
}) {
  const [messages] = useState<Message[]>(initialMessages);
  const [selected, setSelected] = useState<Message | null>(null);

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
      <div className="w-[320px] flex-shrink-0 border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
        </div>

        {messages.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No messages yet.</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => setSelected(msg)}
            className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
              selected?.id === msg.id ? "bg-accent" : ""
            }`}
          >
            <p className="text-xs text-muted-foreground truncate">
              From: {msg.sender_id.slice(0, 8)}...
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
