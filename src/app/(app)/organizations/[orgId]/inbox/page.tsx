import InboxMessagesView from "@/components/InboxMessagesView";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listMessages } from "@/services/messaging/message.service";

export default async function InboxPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const tenant = await requireOrgContext({
  organizationId: orgId
});
  const messages = await listMessages(tenant.supabase, {
    organizationId: tenant.organizationId,
    userId: tenant.userId,
  });

  return (
    <div className="flex w-full max-w-5xl flex-col space-y-8 pb-16">
      <div className="space-y-2">
        <h1 className="text-[2rem] leading-none font-medium tracking-tight text-foreground">
          Inbox
        </h1>
        <p className="max-w-lg text-[15px] text-muted-foreground">
          Review direct messages and project conversations in one place.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <InboxMessagesView initialMessages={messages} />
      </div>
    </div>
  );
}
