import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("empid")
    .select("emp_id, name")
    .eq("email", email)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Supabase error:", error);
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { empID: null },
      { status: 200 }
    );
  }

  return NextResponse.json({
    empID: data.emp_id,
    name: data.name,
  });
}
