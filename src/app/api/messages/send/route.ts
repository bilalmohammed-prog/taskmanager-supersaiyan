import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { createMessage } from "@/services/messaging/message.service";
import { uuidSchema } from "@/lib/validation/common";

const sendMessageSchema = z
  .object({
    organizationId: uuidSchema.optional(),
    content: z.string().trim().min(1).max(4000),
    recipientId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
  })
  .refine((payload) => Boolean(payload.recipientId || payload.projectId), {
    message: "Either recipientId or projectId is required",
  })
  .refine((payload) => !(payload.recipientId && payload.projectId), {
    message: "Provide recipientId or projectId, not both",
  });

export async function POST(req: Request) {
  try {
    const payload = sendMessageSchema.parse(await req.json());
    const tenant = await requireTenantContext(req, {
      organizationId: payload.organizationId,
    });
    authorize("read", "organization", tenant);

    const message = await createMessage(tenant.supabase, {
      organizationId: tenant.organizationId,
      senderId: tenant.userId,
      content: payload.content,
      recipientId: payload.recipientId,
      projectId: payload.projectId,
    });

    return ok(
      {
        message: "Message sent",
        data: message,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST_SEND_MESSAGE_EXCEPTION]:", err);
    return fail(err);
  }
}
