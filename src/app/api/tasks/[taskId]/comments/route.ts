import { fail, ok } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import {
  commentCreateSchema,
  taskCommentsParamsSchema,
} from "@/lib/validation/comment";
import {
  createCommentForTask,
  listCommentsForTask,
} from "@/services/task/comment.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);

    const { taskId } = taskCommentsParamsSchema.parse(await params);
    const comments = await listCommentsForTask(tenant.supabase, {
      organizationId: tenant.organizationId,
      taskId,
    });

    return ok({ comments });
  } catch (err) {
    console.error("[GET_TASK_COMMENTS_EXCEPTION]:", err);
    return fail(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("create", "comment", tenant);

    const { taskId } = taskCommentsParamsSchema.parse(await params);
    const payload = commentCreateSchema.parse(await req.json());

    const comment = await createCommentForTask(tenant.supabase, {
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      taskId,
      content: payload.content,
    });

    return ok(
      {
        message: "Comment created",
        comment,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST_TASK_COMMENT_EXCEPTION]:", err);
    return fail(err);
  }
}
