import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { listOrganizationMembers } from "@/services/organization/organization.service";
import { uuidSchema } from "@/lib/validation/common";

const acceptInviteBodySchema = z.object({
  manager_id: uuidSchema,
}).strict();

export async function POST(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);
    const { supabase, userId, organizationId } = tenant;

    const body = acceptInviteBodySchema.parse(await req.json());
    const { manager_id: managerId } = body;

    const orgMembers = await listOrganizationMembers(supabase, { organizationId });
    const memberSet = new Set(orgMembers.map((member) => member.userId));

    if (!memberSet.has(userId) || !memberSet.has(managerId)) {
      return NextResponse.json(
        { error: "Manager and employee must belong to the same organization" },
        { status: 400 }
      );
    }

    const { error: upsertError } = await supabase
      .from("manager_employees")
      .upsert(
        {
          manager_id: managerId,
          employee_id: userId,
          organization_id: organizationId,
        },
        { onConflict: "organization_id,employee_id" }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { message: "Invitation accepted and manager linked." },
    });
  } catch (err) {
    console.error("Accept Invite Error:", err);
    return fail(err);
  }
}