import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 1. Define strict interfaces for the incoming request and the DB schema
interface UpdateTaskRequest {
  task?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: "pending" | "in-progress" | "completed";
}

interface TaskTableSchema {
  task?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    
    // 2. Cast the body to our interface
    const body: UpdateTaskRequest = await req.json();

    // 3. Use the Schema interface for the payload instead of 'any'
    const updatePayload: TaskTableSchema = {};
    
    if (body.task) updatePayload.task = body.task;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.startTime) updatePayload.start_time = body.startTime;
    if (body.endTime) updatePayload.end_time = body.endTime;
    if (body.status) updatePayload.status = body.status;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No changes detected" }, { status: 400 });
    }

    // 4. Database execution
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updatePayload)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ task: data }, { status: 200 });

  } catch (err) {
    // 5. Exhaustive error checking
    const message = err instanceof Error ? err.message : "Unknown Error";
    console.error("[PATCH_TASK_EXCEPTION]:", message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // 1. Verify Identity
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve Async Params
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // 3. Database Operation
    const { error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("[DELETE_TASK_ERROR]:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });

  } catch (err) {
    console.error("[DELETE_TASK_EXCEPTION]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}