import { connectDB } from "@/lib/mongoose";
import Emp from "@/models/employeesModel";

export async function GET() {
  try {
    await connectDB();

    const employees = await Emp
      .find({ status: "active" })        // optional filter
      .select("name empID -_id")         // only return what UI needs
      .lean();

    return Response.json({ employees });
  } 
  catch (err) {
    console.error("SwitchEmp API error:", err);
    return Response.json(
      { error: "Failed to load employees" },
      { status: 500 }
    );
  }
}

