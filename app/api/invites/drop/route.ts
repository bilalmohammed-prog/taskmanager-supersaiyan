import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { emp_id } = await req.json();

    if (!emp_id) {
      return NextResponse.json(
        { error: "Employee ID required" },
        { status: 400 }
      );
    }

    /* 1️⃣ Get JWT from header */
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    /* 2️⃣ Create Supabase client WITH anon key + user token */
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

const { data: check } = await supabase
  .from("empid")
  .select("emp_id, manager_id")
  .eq("emp_id", emp_id);

console.log("Visible row:", check);


    const { data, error, status } = await supabase
  .from("empid")
  .update({ manager_id: null })
  .eq("emp_id", emp_id)
  .select();

console.log("Status:", status);
console.log("Error:", error);
console.log("Updated rows:", data);



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
