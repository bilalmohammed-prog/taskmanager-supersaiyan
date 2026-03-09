import { fail, ok } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { projectIdParamsSchema, projectUpdateSchema } from "@/lib/validation/project";
import { softDeleteProject, updateProject } from "@/services/project/project.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("update", "project", tenant);

    const { projectId } = projectIdParamsSchema.parse(await params);
    const body = projectUpdateSchema.parse(await req.json());

    const project = await updateProject(tenant.supabase, {
      organizationId: tenant.organizationId,
      projectId,
      name: body.name,
      status: body.status,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    return ok({
      message: "Project updated",
      project,
    });
  } catch (err) {
    console.error("[PATCH_PROJECT_EXCEPTION]:", err);
    return fail(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("delete", "project", tenant);

    const { projectId } = projectIdParamsSchema.parse(await params);

    await softDeleteProject(tenant.supabase, {
      organizationId: tenant.organizationId,
      projectId,
    });

    return ok({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("[DELETE_PROJECT_EXCEPTION]:", err);
    return fail(err);
  }
}
