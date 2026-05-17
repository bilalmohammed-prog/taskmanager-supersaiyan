"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { listOrgMembers } from "@/actions/organization/listOrgMembers";
import { apiFetch } from "@/lib/api/client";
import { ApiException } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppModal } from "@/components/ui/app-modal";

type Props = {
  onClose: () => void;
  fixedType: "message" | "invite";
};

type OrgMember = {
  user_id: string;
  name: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ComposeMessagePopup({ onClose, fixedType }: Props) {
  const { orgId } = useParams<{ orgId: string }>();
  const isInvite = fixedType === "invite";

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<OrgMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isInvite || !orgId) return;

    let cancelled = false;

    async function loadMembers() {
      try {
        setMembersLoading(true);
        const result = await listOrgMembers(orgId);
        if (!cancelled) {
          setMembers(result.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setMembers([]);
        }
      } finally {
        if (!cancelled) {
          setMembersLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [isInvite, orgId]);

  const filteredMembers = useMemo(() => {
    const query = recipientQuery.trim().toLowerCase();
    if (!query) return members.slice(0, 8);
    return members.filter((member) => member.name.toLowerCase().includes(query)).slice(0, 8);
  }, [members, recipientQuery]);

  async function handleSend() {
    if (!content.trim()) return;

    if (isInvite) {
      if (!EMAIL_PATTERN.test(inviteEmail.trim())) {
        setError("Enter a valid invite email.");
        return;
      }
    } else if (!selectedRecipient) {
      setError("Select a teammate to message.");
      return;
    }

    if (!orgId) {
      setError("Organization context is missing. Refresh and try again.");
      return;
    }

    try {
      setSending(true);
      setError(null);

      const endpoint = isInvite ? "/api/invites/send" : "/api/messages/send";
      const body = isInvite
        ? {
            organizationId: orgId,
            inviteEmail: inviteEmail.trim(),
            content: content.trim(),
          }
        : {
            organizationId: orgId,
            recipientId: selectedRecipient?.user_id,
            content: content.trim(),
          };

      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setSuccess(true);
      setTimeout(() => onClose(), 900);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError(isInvite ? "Failed to send invite." : "Failed to send message.");
      }
    } finally {
      setSending(false);
    }
  }

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={sending} className="h-8 px-3 text-sm text-zinc-600">
        Cancel
      </Button>
      <Button
        onClick={() => {
          void handleSend();
        }}
        disabled={(isInvite ? !inviteEmail.trim() : !selectedRecipient) || !content.trim() || sending}
        className="h-8 bg-indigo-600 px-3 text-sm text-white hover:bg-indigo-700"
      >
        {sending ? "Sending..." : isInvite ? "Send Invite" : "Send Message"}
      </Button>
    </>
  );

  return (
    <AppModal
      title={isInvite ? "Send Invite" : "Send Message"}
      description={isInvite ? "Invite a teammate by email." : "Start a direct conversation with a teammate."}
      onClose={onClose}
      widthClassName="w-[420px]"
      footer={footer}
    >
      {isInvite ? (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600">Invite email</label>
          <Input
            type="email"
            placeholder="teammate@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="h-9 border-zinc-200 text-sm placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600">Recipient</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search teammates"
              value={selectedRecipient ? selectedRecipient.name : recipientQuery}
              onChange={(e) => {
                setSelectedRecipient(null);
                setRecipientQuery(e.target.value);
              }}
              className="h-9 border-zinc-200 pl-9 text-sm placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="max-h-44 overflow-auto rounded-md border border-zinc-100 bg-zinc-50/40">
            {membersLoading ? (
              <div className="px-3 py-3 text-sm text-zinc-500">Loading teammates...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="px-3 py-3 text-sm text-zinc-500">No teammates found.</div>
            ) : (
              filteredMembers.map((member) => {
                const active = selectedRecipient?.user_id === member.user_id;
                return (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => {
                      setSelectedRecipient(member);
                      setRecipientQuery(member.name);
                    }}
                    className={`flex w-full items-center justify-between border-b border-zinc-100 px-3 py-2.5 text-left text-sm last:border-b-0 ${active ? "bg-indigo-50 text-indigo-700" : "text-zinc-700 hover:bg-zinc-100/80"}`}
                  >
                    <span className="truncate font-medium">{member.name}</span>
                    {active ? <span className="text-xs font-medium">Selected</span> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600">Message</label>
        <textarea
          placeholder={isInvite ? "Write a short invite note..." : "Write your message..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="min-h-24 w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 hover:border-zinc-300 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-600">{isInvite ? "Invite sent!" : "Message sent!"}</p> : null}
    </AppModal>
  );
}
