import { connectDB } from "@/lib/mongoose";
import Task from "@/models/tasksModel";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const empID = searchParams.get("empID");

    if (!empID)
      return Response.json({ error: "empID required" }, { status: 400 });

    const tasks = await Task
      .find({ empID })        // filter correctly
      .select("-__v -_id")     // include useful fields, exclude junk
      .lean();

    return Response.json({ tasks });
  } catch (err) {
    console.error("displayTasks API error:", err);
    return Response.json(
      { error: "Failed to load tasks" },
      { status: 500 }
    );
  }
}
