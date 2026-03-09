import {
  ConflictError,
  ForbiddenError,
  ValidationError,
} from "@/lib/api/errors";
import { fail, ok } from "@/lib/api/response";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { authorize } from "@/lib/auth/authorization";
import { assignmentCreateSchema } from "@/lib/validation/assignment";
import { toLegacyTaskStatus } from "@/lib/validation/common";
import { taskCreateSchema } from "@/lib/validation/task";

export async function POST(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    const { supabase, user, organizationId } = tenant;
    authorize("create", "task", tenant);

    const payload = taskCreateSchema.parse(await req.json());

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
      throw new ForbiddenError({
        message: "Organization does not exist or is inactive",
      });
    }

    const { data: assigneeMember } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("user_id", payload.user_id)
      .maybeSingle();

    if (!assigneeMember) {
      throw new ForbiddenError({
        message: "Assignee is not in your organization",
      });
    }
    authorize("assign", "task", tenant);

    let validatedProjectId: string | null = null;
    if (payload.project_id) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", payload.project_id)
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .maybeSingle();

      if (projectError) {
        throw new ValidationError({ message: projectError.message });
      }

      if (!project) {
        throw new ForbiddenError({
          message: "Project does not belong to your organization",
        });
      }

      validatedProjectId = project.id;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          project_id: validatedProjectId,
          organization_id: organizationId,
          title: payload.title,
          description: payload.description ?? "",
          due_date: payload.due_date ?? null,
          created_by: user.id,
          deleted_at: null,
          status: "todo",
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ConflictError({ message: error.message, details: error });
      }
      throw new ValidationError({ message: error.message, details: error });
    }

    const assignmentPayload = assignmentCreateSchema.parse({
      task_id: data.id,
      user_id: payload.user_id,
      organization_id: organizationId,
    });

    const { error: assignmentError } = await supabase
      .from("assignments")
      .insert(assignmentPayload);

    if (assignmentError) {
      if (assignmentError.code === "23505") {
        throw new ConflictError({ message: assignmentError.message, details: assignmentError });
      }
      throw new ValidationError({ message: assignmentError.message, details: assignmentError });
    }

    return ok(
      {
        message: "Task created",
        task: {
          employee_id: payload.user_id,
          id: data.id,
          task: data.title,
          description: data.description ?? "",
          startTime: null,
          endTime: data.due_date,
          status: toLegacyTaskStatus(data.status),
          proof: "",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST_TASK_EXCEPTION]:", err);
    return fail(err);
  }
}
