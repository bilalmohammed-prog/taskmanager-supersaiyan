import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { listOrganizationMembers } from "@/services/organization/organization.service";

export async function GET(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);
    const { supabase, userId, organizationId } = tenant;

    const { data: links, error: linksError } = await supabase
      .from("manager_employees")
      .select("employee_id")
      .eq("manager_id", userId)
      .eq("organization_id", organizationId);

    if (linksError || !links || links.length === 0) {
      return NextResponse.json({ success: true, data: { employees: [] } });
    }

    const employeeIds = links.map((l) => l.employee_id);

    const orgMembers = await listOrganizationMembers(supabase, { organizationId });
    const memberByUserId = new Map(orgMembers.map((member) => [member.userId, member.fullName]));

    const employees =
      employeeIds.map((employeeId) => {
        return {
          id: employeeId,
          name: memberByUserId.get(employeeId) ?? "Unnamed",
          user_id: employeeId,
          emp_id: employeeId,
        };
      });

    return NextResponse.json({ success: true, data: { employees } });
  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
