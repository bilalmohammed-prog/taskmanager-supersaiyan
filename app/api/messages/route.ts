// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ===================== CLIENTS ===================== */

// For reading current user
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// For DB read
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ===================== GET ===================== */
export async function GET() {
  try {
    /* 1️⃣ Get Logged In User */
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* 2️⃣ Fetch Messages */
    const { data, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Fetch failed" },
      { status: 500 }
    );
  }
}
