import { fail, ok } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { projectCreateSchema, projectListQuerySchema } from "@/lib/validation/project";
import { createProject, listProjects } from "@/services/project/project.service";

export async function GET(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);

    const url = new URL(req.url);
    const query = projectListQuerySchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
    });

    const result = await listProjects(tenant.supabase, {
      organizationId: tenant.organizationId,
      page: query.page,
      size: query.size,
    });

    return ok({
      projects: result.items,
      pagination: {
        page: result.page,
        size: result.size,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    console.error("[GET_PROJECTS_EXCEPTION]:", err);
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("create", "project", tenant);

    const payload = projectCreateSchema.parse(await req.json());

    const project = await createProject(tenant.supabase, {
      organizationId: tenant.organizationId,
      name: payload.name,
      status: payload.status,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    return ok(
      {
        message: "Project created",
        project,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST_PROJECT_EXCEPTION]:", err);
    return fail(err);
  }
}
