import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const { supabase, organizationId } = await requireTenantContext(req);
    const { data, error } = await supabase
      .from("org_members")
      .select(
        `
          user_id,
          profiles!org_members_user_id_fkey (
            id,
            full_name,
            username
          )
        `
      )
      .eq("organization_id", organizationId)
      .eq("profiles.username", email)
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const profile = data
      ? Array.isArray(data.profiles)
        ? data.profiles[0]
        : data.profiles
      : null;

    if (!data || !profile) {
      return NextResponse.json({ success: true, data: { empID: null } }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      data: {
        empID: data.user_id,
        name: profile.full_name ?? null,
      },
    });
  } catch (err) {
    console.error("[EMPLOYEE_OVERVIEW_EXCEPTION]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
