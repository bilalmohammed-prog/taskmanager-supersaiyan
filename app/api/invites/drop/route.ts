import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/employeesModel";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { empID } = await req.json();

    // Simply remove the managerID field from the employee
    const updatedUser = await User.findOneAndUpdate(
      { empID: empID },
      { $unset: { managerID: "" } }, // Removes the field entirely
      { new: true }
    );

    if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}