import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { uuidSchema } from "@/lib/validation/common";

const dropInviteBodySchema = z.object({
  employee_id: uuidSchema,
  manager_id: uuidSchema,
}).strict();

export async function DELETE(req: Request) {
  try {
    const body = dropInviteBodySchema.parse(await req.json());
    const { employee_id, manager_id } = body;

    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);
    const { supabase, userId, organizationId } = tenant;

    if (userId !== manager_id) {
      return NextResponse.json(
        { error: "Forbidden: manager_id must match authenticated user" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("manager_employees")
      .delete()
      .eq("manager_id", manager_id)
      .eq("employee_id", employee_id)
      .eq("organization_id", organizationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error("Drop Manager Error:", err);
    return fail(err);
  }
}