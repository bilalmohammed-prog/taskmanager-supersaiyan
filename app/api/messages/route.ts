// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Message from "@/models/messageModel";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const messages = await Message.find({
      $or: [{ senderEmail: email }, { receiverEmail: email }]
    }).sort({ createdAt: -1 });

    return NextResponse.json(messages);
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}