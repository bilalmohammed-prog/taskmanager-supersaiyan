import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
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
      return NextResponse.json({ employees: [] });
    }

    const { data: me, error: meError } = await supabase
      .from("profiles")
      .select("active_organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (meError || !me?.active_organization_id) {
      return NextResponse.json({ employees: [] });
    }

    const organizationId = me.active_organization_id;

    const { data: links, error: linksError } = await supabase
      .from("manager_employees")
      .select("employee_id")
      .eq("manager_id", user.id)
      .eq("organization_id", organizationId);

    if (linksError || !links || links.length === 0) {
      return NextResponse.json({ employees: [] });
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
      return NextResponse.json({ employees: [] });
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

    return NextResponse.json({ employees });
  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json({ employees: [] });
  }
}