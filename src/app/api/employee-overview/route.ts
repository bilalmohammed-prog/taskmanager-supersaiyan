import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { listWorkforceProfiles } from "@/services/resource/resource.service";

export async function GET(req: Request) {
  const routeStart = Date.now();
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const tenantStart = Date.now();
    const tenant = await requireTenantContext(req);
    console.info(`[perf] [Fetch] api employee-overview requireTenantContext ${Date.now() - tenantStart}ms`);
    authorize("read", "organization", tenant);
    const { supabase, organizationId } = tenant;
    const queryStart = Date.now();
    const profiles = await listWorkforceProfiles(supabase, { organizationId });
    console.info(`[perf] [DB] api employee-overview listWorkforceProfiles ${Date.now() - queryStart}ms`);
    const computeStart = Date.now();
    const matched = profiles.find((profile) => profile.username === email);
    const computeMs = Date.now() - computeStart;
    if (computeMs > 4) {
      console.info(`[perf] [Compute] api employee-overview find profile ${computeMs}ms`);
    }

    if (!matched) {
      console.info(`[perf] [Page] api employee-overview total ${Date.now() - routeStart}ms`);
      return NextResponse.json({ success: true, data: { empID: null } }, { status: 200 });
    }

    console.info(`[perf] [Page] api employee-overview total ${Date.now() - routeStart}ms`);
    return NextResponse.json({
      success: true,
      data: {
        empID: matched.id,
        name: matched.full_name ?? null,
      },
    });
  } catch (err) {
    console.info(`[perf] [Page] api employee-overview total ${Date.now() - routeStart}ms`);
    console.error("[EMPLOYEE_OVERVIEW_EXCEPTION]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
