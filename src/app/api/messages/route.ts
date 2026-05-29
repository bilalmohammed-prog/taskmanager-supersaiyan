import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { fail, ok } from "@/lib/api/response";
import { listMessages } from "@/services/messaging/message.service";
import { uuidSchema } from "@/lib/validation/common";

export async function GET(req: Request) {
  const routeStart = Date.now();
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");
    const validatedOrganizationId = organizationId
      ? uuidSchema.parse(organizationId)
      : undefined;

    const tenantStart = Date.now();
    const tenant = await requireTenantContext(req, {
      organizationId: validatedOrganizationId,
    });
    console.info(`[perf] [Fetch] api messages requireTenantContext ${Date.now() - tenantStart}ms`);
    authorize("read", "organization", tenant);

    const recipientId = url.searchParams.get("recipientId") ?? undefined;
    const projectId = url.searchParams.get("projectId") ?? undefined;

    const queryStart = Date.now();
    const messages = await listMessages(tenant.supabase, {
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      recipientId,
      projectId,
    });
    console.info(`[perf] [DB] api messages listMessages ${Date.now() - queryStart}ms`);
    console.info(`[perf] [Page] api messages GET total ${Date.now() - routeStart}ms`);
    

    return ok({ messages });
  } catch (err) {
    console.info(`[perf] [Page] api messages GET total ${Date.now() - routeStart}ms`);
    console.error("[GET_MESSAGES_EXCEPTION]:", err);
    return fail(err);
  }
}
