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
import { listAssignments } from "@/services/resource/assignment.service";
import { getProjectById } from "@/services/resource/project.service";
import { deleteTask as deleteTaskService, getTaskById } from "@/services/task/task.service";

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

    const task = await getTaskById(supabase, { organizationId, taskId });

    if (!task) {
      throw new ValidationError({ message: "Task not found in your organization" });
    }

    if (task.project_id) {
      const project = await getProjectById(supabase, {
        organizationId,
        projectId: task.project_id,
      });

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

    const assignments = await listAssignments(supabase, {
      organizationId,
      taskId,
    });
    const assignment = assignments[0];

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

    await deleteTaskService(supabase, { organizationId, taskId });

    return ok({ message: "Task deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("[DELETE_TASK_EXCEPTION]:", err);
    return fail(err);
  }
}
