import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { messageId } = await req.json();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID required" },
        { status: 400 }
      );
    }

    /* ===================== 1️⃣ GET MESSAGE ===================== */
    const { data: message, error: msgError } = await supabase
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
      return NextResponse.json({ error: "Not an invite" }, { status: 400 });
    }

    if (message.status !== "pending") {
      return NextResponse.json(
        { error: "Invite already processed" },
        { status: 400 }
      );
    }

    /* 🔒 EXTRA CHECK */
    if (message.receiver_id !== user.id) {
      return NextResponse.json(
        { error: "You are not the invite receiver" },
        { status: 403 }
      );
    }

    /* ===================== 2️⃣ LINK EMPLOYEE ===================== */
    const { error: empError } = await supabase
      .from("empid")
      .update({ manager_id: message.sender_id })
      .eq("user_id", message.receiver_id);

    if (empError) {
      return NextResponse.json(
        { error: empError.message },
        { status: 500 }
      );
    }

    /* ===================== 3️⃣ MARK MESSAGE ACCEPTED ===================== */
    const { error: statusError } = await supabase
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
