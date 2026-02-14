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

    /* ===================== AUTH CHECK ===================== */
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

    /* ===================== GET MESSAGE ===================== */
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("receiver_id, status, type")
      .eq("id", messageId)
      .single();

    if (fetchError || !message) {
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
        { error: "Already processed" },
        { status: 400 }
      );
    }

    /* 🔒 EXTRA SAFETY CHECK */
    if (message.receiver_id !== user.id) {
      return NextResponse.json(
        { error: "Not your invite" },
        { status: 403 }
      );
    }

    /* ===================== UPDATE STATUS ===================== */
    const { error: updateError } = await supabase
      .from("messages")
      .update({ status: "declined" })
      .eq("id", messageId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
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
