import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: Request) {
  try {
    const { employee_id, manager_id } = await req.json();

    if (!employee_id || !manager_id) {
      return NextResponse.json(
        { error: "employee_id and manager_id are required" },
        { status: 400 }
      );
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== manager_id) {
      return NextResponse.json(
        { error: "Forbidden: manager_id must match authenticated user" },
        { status: 403 }
      );
    }

    const { data: me, error: meError } = await supabase
      .from("profiles")
      .select("active_organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (meError || !me?.active_organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { error } = await supabase
      .from("manager_employees")
      .delete()
      .eq("manager_id", manager_id)
      .eq("employee_id", employee_id)
      .eq("organization_id", me.active_organization_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Drop Manager Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
