import { connectDB } from "@/lib/mongoose";
import Emp from "@/models/employeesModel";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // 1. CRITICAL: Actually call the connection function
    await connectDB(); 

    const { searchParams } = new URL(req.url);
    const managerID = searchParams.get("managerID");

    if (!managerID) {
      // Returning an empty list if no ID is provided is good practice
      return NextResponse.json({ employees: [] });
    }

    // 2. Query MongoDB
    // This looks for documents where the "managerID" field equals your variable
    const employees = await Emp.find({ managerID: managerID });

    return NextResponse.json({ employees });
  } 
  catch (err) {
    console.error("SwitchEmp API error:", err);
    return NextResponse.json(
      { error: "Failed to load employees" },
      { status: 500 }
    );
  }
}