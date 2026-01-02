import { connectDB } from "@/lib/mongoose";
import Task from "@/models/tasksModel";

// update tasks
export async function PATCH(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    await connectDB();

    const body = await req.json();
    const {taskId} = await params;
    
    if (!taskId)
      return Response.json({ error: "taskId required" }, { status: 400 });

    const updated = await Task.findOneAndUpdate(
      { id: taskId },   // use your custom task id
      body,
      { new: true }
    ).select("-__v -_id");

    if (!updated)
      return Response.json({ error: "Task not found" }, { status: 404 });

    return Response.json({ task: updated });
  } catch (err) {
    console.error("update task error:", err);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// delete tasks
export async function DELETE(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    await connectDB();

    const {taskId} = await params;

    if (!taskId)
      return Response.json({ error: "taskId required" }, { status: 400 });

    const deleted = await Task.findOneAndDelete({ id: taskId });

    if (!deleted)
      return Response.json({ error: "Task not found" }, { status: 404 });

    return Response.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("delete task error:", err);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
