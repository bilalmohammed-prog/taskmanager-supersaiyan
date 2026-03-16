import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export async function GET(req: Request) {
  try {
    const { supabase, userId, organizationId } = await requireTenantContext(req);

    const { data: links, error: linksError } = await supabase
      .from("manager_employees")
      .select("employee_id")
      .eq("manager_id", userId)
      .eq("organization_id", organizationId);

    if (linksError || !links || links.length === 0) {
      return NextResponse.json({ success: true, data: { employees: [] } });
    }

    const employeeIds = links.map((l) => l.employee_id);

    const { data, error } = await supabase
      .from("org_members")
      .select(
        `
          user_id,
          profiles!org_members_user_id_fkey (
            id,
            full_name
          )
        `
      )
      .eq("organization_id", organizationId)
      .in("user_id", employeeIds);

    if (error) {
      console.error(error);
      return NextResponse.json({ success: true, data: { employees: [] } });
    }

    const employees =
      data?.map((e) => {
        const profile = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
        return {
          id: e.user_id,
          name: profile?.full_name ?? "Unnamed",
          user_id: e.user_id,
          emp_id: e.user_id,
        };
      }) ?? [];

    return NextResponse.json({ success: true, data: { employees } });
  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
