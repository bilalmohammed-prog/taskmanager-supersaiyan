import InboxMessagesView from "@/components/InboxMessagesView";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listMessages } from "@/services/messaging/message.service";

export default async function InboxPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  console.time("[perf] inbox page total");
  const { orgId } = await params;
  console.time("[perf] inbox requireOrgContext");
  const tenant = await requireOrgContext({
    organizationId: orgId,
  });
  console.timeEnd("[perf] inbox requireOrgContext");
  
  // POTENTIAL WATERFALL
  console.time("[perf] inbox listMessages");
  const messages = await listMessages(tenant.supabase, {
    organizationId: tenant.organizationId,
    userId: tenant.userId,
  });
  console.timeEnd("[perf] inbox listMessages");
  console.timeEnd("[perf] inbox page total");

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
