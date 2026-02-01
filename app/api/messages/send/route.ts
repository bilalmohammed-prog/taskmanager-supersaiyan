import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ===================== CLIENTS ===================== */

// Used ONLY to read the logged-in user (anon key)

// Used ONLY for inserts / lookups (service role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ===================== POST ===================== */
export async function POST(req: Request) {
  try {
    const { receiverEmail, subject, body, type } =
      await req.json();

    if (!receiverEmail || !subject || !body || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ===================== 1️⃣ AUTH ===================== */
    /* ===================== 1️⃣ AUTH VIA HEADER TOKEN ===================== */
const authHeader = req.headers.get("authorization");

if (!authHeader) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const token = authHeader.replace("Bearer ", "");

const {
  data: { user: sender },
  error: authError,
} = await supabaseAdmin.auth.getUser(token);

if (!sender || authError) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}


    if (!sender || authError) {
      console.log("Auth error:", authError);
      
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ===================== 2️⃣ RESOLVE RECEIVER ===================== */
    const { data: receiver } = await supabaseAdmin
      .from("empid")
      .select("user_id")
      .eq("email", receiverEmail)
      .maybeSingle();

    if (!receiver?.user_id) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    /* ===================== 3️⃣ INSERT MESSAGE ===================== */
    const { error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: sender.id,
        receiver_id: receiver.user_id,

        sender_email: sender.email,
        receiver_email: receiverEmail,

        subject,
        body,
        type,
        status: "pending",

      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
