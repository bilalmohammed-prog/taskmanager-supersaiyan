import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    /* 1️⃣ AUTH */
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ employees: [] });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);


    if (!user || error) {
      return NextResponse.json({ employees: [] });
    }

    /* 2️⃣ QUERY EMPLOYEES USING LOGGED-IN USER ID */
    const { data, error: empError } = await supabaseAdmin
      .from("empid")
      .select("emp_id, name")
      .eq("manager_id", user.id);

    if (empError) {
      return NextResponse.json({ employees: [] });
    }

    /* 3️⃣ FORMAT */
    const employees =
      data?.map((e) => ({
        emp_id: e.emp_id,
        name: e.name,
      })) ?? [];

    return NextResponse.json({ employees });
  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json({ employees: [] });
  }
}
