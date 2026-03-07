import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type AcceptInviteRequest = {
  manager_id?: string;
  managerId?: string;
  organization_id?: string;
  orgId?: string;
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AcceptInviteRequest = await req.json().catch(() => ({}));
    const managerId = body.manager_id ?? body.managerId;

    if (!managerId) {
      return NextResponse.json(
        { error: "manager_id is required" },
        { status: 400 }
      );
    }

    const { data: employeeProfile, error: employeeProfileError } = await supabase
      .from("profiles")
      .select("active_organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (employeeProfileError || !employeeProfile) {
      return NextResponse.json(
        { error: "Employee profile not found" },
        { status: 400 }
      );
    }

    const organizationId =
      body.organization_id ?? body.orgId ?? employeeProfile.active_organization_id;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organization_id is required" },
        { status: 400 }
      );
    }

    const { data: membershipRows, error: membershipError } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .in("user_id", [user.id, managerId]);

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    const memberSet = new Set((membershipRows ?? []).map((m) => m.user_id));

    if (!memberSet.has(user.id) || !memberSet.has(managerId)) {
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
          employee_id: user.id,
          organization_id: organizationId,
        },
        { onConflict: "organization_id,employee_id" }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Invitation accepted and manager linked.",
    });
  } catch (err) {
    console.error("Accept Invite Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}