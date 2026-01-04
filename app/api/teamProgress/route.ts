import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Emp from "@/models/employeesModel";
import Task from "@/models/tasksModel"; // Ensure this path is correct

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const managerID = searchParams.get("managerID");

    if (!managerID) return NextResponse.json({ error: "No manager ID" }, { status: 400 });

    // 1. Get all employees under this manager
    const employees = await Emp.find({ managerID });
    const empIDs = employees.map(e => e.empID);

    // 2. Aggregation: Count tasks per employee in ONE database call
    const stats = await Task.aggregate([
      { $match: { empID: { $in: empIDs } } },
      {
        $group: {
          _id: "$empID",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $in: ["$status", ["completed", "completeLate"]] }, 1, 0] }
          }
        }
      }
    ]);

    // 3. Merge employee info with their task stats
    const report = employees.map(e => {
      const stat = stats.find(s => s._id === e.empID) || { total: 0, completed: 0 };
      return {
        empID: e.empID,
        name: e.name,
        email: e.email || "N/A",
        total: stat.total,
        completed: stat.completed
      };
    });

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}