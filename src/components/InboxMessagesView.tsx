"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/types/database";

type Message = Tables<"messages">;
type Invite = Tables<"invites">;
type InviteStatus = "pending" | "accepted" | "declined" | "expired" | "revoked";

type MessageUI = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
};

type ExtendedMessageUI = MessageUI & {
  recipient_id?: string | null;
  _type?: "invite";
  invite_id?: string;
  status?: InviteStatus;
  invite_email?: string;
  canAccept?: boolean;
};

function toMessageUI(message: Message): ExtendedMessageUI {
  return {
    id: message.id,
    content: message.content,
    created_at: message.created_at,
    sender_id: message.sender_id,
    recipient_id: message.recipient_id,
  };
}

function toInviteMessageUI(invite: Invite, normalizedEmail: string): ExtendedMessageUI {
  const inviteStatus =
    invite.status === "pending" ||
    invite.status === "accepted" ||
    invite.status === "declined" ||
    invite.status === "expired" ||
    invite.status === "revoked"
      ? invite.status
      : "pending";

  return {
    id: `invite-${invite.id}`,
    content: invite.content?.trim() ? invite.content : "You've been invited",
    created_at: invite.created_at ?? new Date().toISOString(),
    sender_id: invite.inviter_id,
    recipient_id: null,
    _type: "invite",
    invite_id: invite.id,
    status: inviteStatus,
    invite_email: invite.invite_email,
    canAccept: invite.invite_email.toLowerCase().trim() === normalizedEmail,
  };
}

export default function InboxMessagesView({
  initialMessages,
}: {
  initialMessages: Message[];
}) {
  const { orgId } = useParams<{ orgId: string }>();
  const [messages, setMessages] = useState<ExtendedMessageUI[]>(
    initialMessages.map(toMessageUI)
  );
  const [selected, setSelected] = useState<ExtendedMessageUI | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refreshMessages() {
      try {
        const [response, authResult] = await Promise.all([
          fetch(`/api/messages?organizationId=${encodeURIComponent(orgId)}`, {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }),
          supabase.auth.getUser(),
        ]);

        const apiMessages: Message[] = response.ok
          ? (((await response.json()) as { data?: { messages?: Message[] } }).data?.messages ?? [])
          : [];

        const normalizedEmail = authResult.data.user?.email?.toLowerCase().trim() ?? "";
        const currentUserId = authResult.data.user?.id ?? "";
        const inviteRows: Invite[] = normalizedEmail
          ? await (async () => {
              const { data, error } = await supabase
                .from("invites")
                .select("*")
                .or(`inviter_id.eq.${currentUserId},invite_email.eq.${normalizedEmail}`)
                .order("created_at", { ascending: false });

              if (error) {
                return [];
              }

              return data ?? [];
            })()
          : [];

        const mergedMessages = [
          ...apiMessages.map(toMessageUI),
          ...inviteRows.map((invite) => toInviteMessageUI(invite, normalizedEmail)),
        ];

        const byId = new Map<string, ExtendedMessageUI>();
        mergedMessages.forEach((item) => {
          byId.set(item.id, item);
        });

        const nextMessages = Array.from(byId.values());
        if (cancelled) {
          return;
        }

        const ordered = [...nextMessages].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setMessages(ordered);
        setSelected((prev) => {
          if (!prev) return null;
          return ordered.find((message) => message.id === prev.id) ?? null;
        });
      } catch {
        // Keep existing inbox content if polling fails.
      }
    }

    refreshMessages();
    const pollTimer = setInterval(refreshMessages, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
    };
  }, [orgId]);

  async function acceptInvite(message: ExtendedMessageUI): Promise<void> {
    if (message._type !== "invite" || message.status !== "pending" || !message.invite_id) {
      return;
    }

    setAcceptError(null);

    const response = await fetch("/api/invites/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        invite_id: message.invite_id,
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setAcceptError(result?.error ?? "Could not accept invite. Please try again.");
      return;
    }

    setMessages((prev) =>
      prev.map((item) =>
        item.id === message.id
          ? {
              ...item,
              status: "accepted",
            }
          : item
      )
    );
    setSelected((prev) =>
      prev && prev.id === message.id
        ? {
            ...prev,
            status: "accepted",
          }
        : prev
    );
  }

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

        {acceptError && (
          <p className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {acceptError}
          </p>
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
            {msg._type === "invite" && msg.status === "pending" && msg.canAccept && (
              <button
                type="button"
                className="mt-2 inline-flex h-7 items-center rounded-md bg-zinc-900 px-2.5 text-xs font-medium text-zinc-50"
                onClick={(e) => {
                  e.stopPropagation();
                  void acceptInvite(msg);
                }}
              >
                Accept
              </button>
            )}
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
              {selected._type === "invite" && selected.status === "pending" && selected.canAccept && (
                <button
                  type="button"
                  className="mt-3 inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-zinc-50"
                  onClick={() => {
                    void acceptInvite(selected);
                  }}
                >
                  Accept
                </button>
              )}
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
