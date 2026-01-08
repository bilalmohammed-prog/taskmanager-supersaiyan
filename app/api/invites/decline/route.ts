import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
// Replace with your actual Message model import
import Message from "@/models/messageModel"; 

export async function POST(req: Request) {
  try {
    await connectDB();
    const { messageId } = await req.json();

    const updatedMsg = await Message.findByIdAndUpdate(
      messageId,
      { status: "declined" },
      { new: true }
    );

    if (!updatedMsg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}