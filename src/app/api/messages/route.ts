import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { fail, ok } from "@/lib/api/response";
import { listMessages } from "@/services/messaging/message.service";
import { uuidSchema } from "@/lib/validation/common";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");
    const validatedOrganizationId = organizationId
      ? uuidSchema.parse(organizationId)
      : undefined;

    const tenant = await requireTenantContext(req, {
      organizationId: validatedOrganizationId,
    });
    authorize("read", "organization", tenant);

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
