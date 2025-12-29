import { connectDB } from "@/lib/mongoose";
import Task from "@/models/tasksModel";

export async function GET() {
  await connectDB();
  const tasks = await Task.find();
  return Response.json(tasks);
}
