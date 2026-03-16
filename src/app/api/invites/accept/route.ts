import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

type AcceptInviteRequest = {
  manager_id?: string;
  managerId?: string;
};

export async function POST(req: Request) {
  try {
    const { supabase, userId, organizationId } = await requireTenantContext(req);

    const body: AcceptInviteRequest = await req.json().catch(() => ({}));
    const managerId = body.manager_id ?? body.managerId;

    if (!managerId) {
      return NextResponse.json(
        { error: "manager_id is required" },
        { status: 400 }
      );
    }

    const { data: membershipRows, error: membershipError } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .in("user_id", [userId, managerId]);

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    const memberSet = new Set((membershipRows ?? []).map((m) => m.user_id));

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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
