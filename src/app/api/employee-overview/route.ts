import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { listWorkforceProfiles } from "@/services/resource/resource.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);
    const { supabase, organizationId } = tenant;
    const profiles = await listWorkforceProfiles(supabase, { organizationId });
    const matched = profiles.find((profile) => profile.username === email);

    if (!matched) {
      return NextResponse.json({ success: true, data: { empID: null } }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      data: {
        empID: matched.id,
        name: matched.full_name ?? null,
      },
    });
  } catch (err) {
    console.error("[EMPLOYEE_OVERVIEW_EXCEPTION]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
