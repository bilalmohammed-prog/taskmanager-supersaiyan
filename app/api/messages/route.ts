// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ===================== GET ===================== */
export async function GET(req: Request) {
  try {
    /* 1️⃣ Get JWT from headers */
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* 2️⃣ Create Supabase Client WITH USER TOKEN */
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

    /* 3️⃣ Fetch Messages — RLS handles filtering */
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
