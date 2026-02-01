import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ===================== ADMIN CLIENT ===================== */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

export async function POST(req: Request) {
  try {
    const { empID } = await req.json();

    if (!empID) {
      return NextResponse.json(
        { error: "Employee ID required" },
        { status: 400 }
      );
    }

    /* ===================== REMOVE MANAGER ===================== */
    const { error } = await supabaseAdmin
      .from("empid")
      .update({ manager_id: null })   // 🔥 PostgreSQL way
      .eq("emp_id", empID);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Drop Manager Error:", err);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
