import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { receiverEmail, subject, body, type } = await req.json();

    if (!receiverEmail || !subject || !body || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* 1️⃣ Get JWT */
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    /* 2️⃣ Create USER client (RLS enforced) */
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

    /* 3️⃣ Get current user */
    const {
      data: { user: sender },
      error: authError,
    } = await supabase.auth.getUser();

    if (!sender || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* 4️⃣ Resolve receiver (still RLS safe) */
    const { data: receiver } = await supabase
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

    /* 5️⃣ Insert — RLS APPLIES HERE */
    const { error: insertError } = await supabase
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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
