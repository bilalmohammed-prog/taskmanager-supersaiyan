import { fail, ok } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import {
  assignmentIdParamsSchema,
  assignmentUpdateSchema,
} from "@/lib/validation/assignment";
import {
  deleteAssignment,
  updateAssignment,
} from "@/services/resource/assignment.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("update", "assignment", tenant);

    const { assignmentId } = assignmentIdParamsSchema.parse(await params);
    const payload = assignmentUpdateSchema.parse(await req.json());

    const assignment = await updateAssignment(tenant.supabase, {
      organizationId: tenant.organizationId,
      assignmentId,
      updates: payload,
    });

    return ok({
      message: "Assignment updated",
      assignment,
    });
  } catch (err) {
    console.error("[PATCH_ASSIGNMENT_EXCEPTION]:", err);
    return fail(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("update", "assignment", tenant);

    const { assignmentId } = assignmentIdParamsSchema.parse(await params);

    await deleteAssignment(tenant.supabase, {
      organizationId: tenant.organizationId,
      assignmentId,
    });

    return ok({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("[DELETE_ASSIGNMENT_EXCEPTION]:", err);
    return fail(err);
  }
}
