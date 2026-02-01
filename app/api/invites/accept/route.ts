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

    /* ===================== 1️⃣ GET MESSAGE ===================== */
    const { data: message, error: msgError } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (msgError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (message.type !== "invite") {
      return NextResponse.json(
        { error: "Not an invite" },
        { status: 400 }
      );
    }

    if (message.status !== "pending") {
      return NextResponse.json(
        { error: "Invite already processed" },
        { status: 400 }
      );
    }

    if (!message.sender_id || !message.receiver_id) {
      return NextResponse.json(
        { error: "Corrupted invite data" },
        { status: 500 }
      );
    }

    /* ===================== 2️⃣ LINK EMPLOYEE TO MANAGER ===================== */
    console.log("Linking employee", message.receiver_id, "to manager", message.sender_id);
    const { error: empError } = await supabaseAdmin
      .from("empid")
      .update({ manager_id: message.sender_id }) // manager = sender
      .eq("user_id", message.receiver_id);       // employee = receiver

    if (empError) {
      return NextResponse.json(
        { error: empError.message },
        { status: 500 }
      );
    }

    /* ===================== 3️⃣ MARK MESSAGE ACCEPTED ===================== */
    const { error: statusError } = await supabaseAdmin
      .from("messages")
      .update({ status: "accepted" })
      .eq("id", messageId);

    if (statusError) {
      return NextResponse.json(
        { error: statusError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitation accepted and manager linked.",
    });

  } catch (err) {
    console.error("Accept Invite Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
