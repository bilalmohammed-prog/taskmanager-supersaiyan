import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export async function DELETE(req: Request) {
  try {
    const { employee_id, manager_id } = await req.json();

    if (!employee_id || !manager_id) {
      return NextResponse.json(
        { error: "employee_id and manager_id are required" },
        { status: 400 }
      );
    }

    const { supabase, userId, organizationId } = await requireTenantContext(req);
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
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
