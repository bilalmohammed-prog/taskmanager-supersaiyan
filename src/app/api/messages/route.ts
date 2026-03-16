import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { fail, ok } from "@/lib/api/response";
import { listMessages } from "@/services/messaging/message.service";

export async function GET(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);

    const url = new URL(req.url);
    const recipientId = url.searchParams.get("recipientId") ?? undefined;
    const projectId = url.searchParams.get("projectId") ?? undefined;

    const messages = await listMessages(tenant.supabase, {
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      recipientId,
      projectId,
    });

    return ok({ messages });
  } catch (err) {
    console.error("[GET_MESSAGES_EXCEPTION]:", err);
    return fail(err);
  }
}
