import { connectDB } from "@/lib/mongoose";
import Emp from "@/models/employeesModel";

export async function GET() {
  await connectDB();

  // however you determine employee list
  const employees = await Emp.find().select("empID");
console.log(employees);
  return Response.json({ employees });
}
