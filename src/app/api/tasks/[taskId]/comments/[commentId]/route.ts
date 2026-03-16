import { fail, ok } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import {
  commentUpdateSchema,
  taskCommentParamsSchema,
} from "@/lib/validation/comment";
import {
  deleteCommentForTask,
  updateCommentForTask,
} from "@/services/task/comment.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string; commentId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("create", "comment", tenant);
    const { taskId, commentId } = taskCommentParamsSchema.parse(await params);
    const payload = commentUpdateSchema.parse(await req.json());

    const comment = await updateCommentForTask(tenant.supabase, {
      organizationId: tenant.organizationId,
      taskId,
      commentId,
      content: payload.content,
      actorId: tenant.userId,
      actorRole: tenant.role,
    });

    return ok({
      message: "Comment updated",
      comment,
    });
  } catch (err) {
    console.error("[PATCH_TASK_COMMENT_EXCEPTION]:", err);
    return fail(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string; commentId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("create", "comment", tenant);
    const { taskId, commentId } = taskCommentParamsSchema.parse(await params);

    await deleteCommentForTask(tenant.supabase, {
      organizationId: tenant.organizationId,
      taskId,
      commentId,
      actorId: tenant.userId,
      actorRole: tenant.role,
    });

    return ok({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("[DELETE_TASK_COMMENT_EXCEPTION]:", err);
    return fail(err);
  }
}
