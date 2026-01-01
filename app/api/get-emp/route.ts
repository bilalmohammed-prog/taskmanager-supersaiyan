import { NextResponse } from "next/server";
import {connectDB as db} from "@/lib/mongoose";          // your DB connect
import Employee from "@/models/employeesModel";

export async function GET(req: Request) {
  await db();   // ensure DB connected

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email required" },
      { status: 400 }
    );
  }

  const emp = await Employee.findOne({ email });

  if (!emp) {
    return NextResponse.json(
      { empID: null },
      { status: 200 }
    );
  }

  return NextResponse.json({
    empID: emp.empID,
    name: emp.name
  });
}
