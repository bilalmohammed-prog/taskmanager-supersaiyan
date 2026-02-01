import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ===================== ADMIN CLIENT ===================== */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

export async function POST(req: Request) {
  try {
    const { messageId } = await req.json();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID required" },
        { status: 400 }
      );
    }

    /* ===================== UPDATE MESSAGE ===================== */
    const { error } = await supabaseAdmin
      .from("messages")
      .update({ status: "declined" })
      .eq("id", messageId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Decline Invite Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
