import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Message from "@/models/messageModel";
import User from "@/models/employeesModel"; // Or your Employee/User model

export async function POST(req: Request) {
  try {
    await connectDB();
    const { messageId, managerID, empEmail } = await req.json();

    // 1. Update the Message status to 'accepted'
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { status: "accepted" },
      { new: true }
    );

    if (!updatedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // 2. Link the Employee to the Manager
    // Update the user whose email matches the receiverEmail of the invite
    const updatedUser = await User.findOneAndUpdate(
      { email: empEmail },
      { managerID: managerID }, // Set the managerID allotted by the invite
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Invitation accepted and manager linked." 
    });
    
  } catch (error) {
    console.error("Accept Invite Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}