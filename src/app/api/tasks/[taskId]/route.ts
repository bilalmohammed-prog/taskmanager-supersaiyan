import { ValidationError } from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { authorize } from "@/lib/auth/authorization";
import { toLegacyTaskStatus } from "@/lib/validation/common";
import {
  normalizeTaskUpdateStatus,
  taskIdParamsSchema,
  taskUpdateSchema,
} from "@/lib/validation/task";

/* ---------- TYPES ---------- */
interface TaskTableUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  status?: "todo" | "in_progress" | "blocked" | "done";
}

/* ================= PATCH ================= */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    const { supabase, organizationId } = tenant;
    authorize("update", "task", tenant);

    const { taskId } = taskIdParamsSchema.parse(await params);
    const body = taskUpdateSchema.parse(await req.json());

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .is("deleted_at", null)
      .maybeSingle();

    if (organizationError) {
      throw new ValidationError({
        message: organizationError.message,
        details: organizationError,
      });
    }

    if (!organization) {
      throw new ValidationError({
        message: "Organization does not exist or is inactive",
      });
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, project_id")
      .eq("id", taskId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .maybeSingle();

    if (taskError) {
      throw new ValidationError({ message: taskError.message, details: taskError });
    }

    if (!task) {
      throw new ValidationError({ message: "Task not found in your organization" });
    }

    if (task.project_id) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", task.project_id)
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .maybeSingle();

      if (projectError) {
        throw new ValidationError({
          message: projectError.message,
          details: projectError,
        });
      }

      if (!project) {
        throw new ValidationError({
          message: "Task has an invalid project for this organization",
        });
      }
    }

    const updatePayload: TaskTableUpdate = {};

    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.description !== undefined)
      updatePayload.description = body.description;
    if (body.dueDate !== undefined) updatePayload.due_date = body.dueDate;
    const normalizedStatus = normalizeTaskUpdateStatus(body.status);
    if (normalizedStatus !== undefined) updatePayload.status = normalizedStatus;

    const { data, error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", taskId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .select()
      .maybeSingle();

    if (error) {
      throw new ValidationError({ message: error.message, details: error });
    }
    if (!data) {
      throw new ValidationError({ message: "Task not found in your organization" });
    }

    const { data: assignment } = await supabase
      .from("assignments")
      .select("user_id")
      .eq("task_id", taskId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    return ok(
      {
        task: data
          ? {
              employee_id: assignment?.user_id ?? "",
              id: data.id,
              task: data.title,
              description: data.description ?? "",
              startTime: null,
              endTime: data.due_date,
              status: toLegacyTaskStatus(data.status),
              proof: "",
            }
          : null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PATCH_TASK_EXCEPTION]:", err);
    return fail(err);
  }
}

/* ================= DELETE ================= */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    const { supabase, organizationId } = tenant;
    authorize("delete", "task", tenant);

    const { taskId } = taskIdParamsSchema.parse(await params);

    const { error } = await supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null);

    if (error) {
      throw new ValidationError({ message: error.message, details: error });
    }

    return ok({ message: "Task deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("[DELETE_TASK_EXCEPTION]:", err);
    return fail(err);
  }
}
