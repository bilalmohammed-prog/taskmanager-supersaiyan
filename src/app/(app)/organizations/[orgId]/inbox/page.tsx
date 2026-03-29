import InboxMessagesView from "@/components/InboxMessagesView";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { getSupabaseServer } from "@/lib/supabase/server";
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
        <h1 className="text-[2rem] leading-none font-medium tracking-tight text-zinc-900">
          Inbox
        </h1>
        <p className="max-w-lg text-[15px] text-zinc-500">
          Review direct messages and project conversations in one place.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <InboxMessagesView initialMessages={messages} />
      </div>
    </div>
  );
}
