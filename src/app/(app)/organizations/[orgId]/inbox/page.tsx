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

  return <InboxMessagesView initialMessages={messages} />;
}
