import { NextResponse } from "next/server";
import {connectDB} from "@/lib/mongoose";
import Task from "@/models/tasksModel";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { empID, id, task, startTime, endTime, status, proof } = body;

    if (!empID || !id || !task || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newTask = await Task.create({
      empID,
      id,
      task,
      startTime,
      endTime,
      status: status || "pending",
      proof: proof || ""
    });

    return NextResponse.json(
      { message: "Task created", task: newTask },
      { status: 201 }
    );
  } catch (err: unknown) {
  console.error("Create task error", err);

  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "Server error";

  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
  }
}
