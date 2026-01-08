import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Message from "@/models/messageModel";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Basic validation
    if (!body.senderEmail || !body.receiverEmail || !body.subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMessage = await Message.create({
      senderEmail: body.senderEmail,
      receiverEmail: body.receiverEmail,
      subject: body.subject,
      body: body.body,
      type: body.type,
      managerID: body.managerID,
      status: "pending",
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}