import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;

  return user;
}

/* ================= PATCH ================= */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body: UpdateTaskRequest = await req.json();

    const updatePayload: TaskTableSchema = {};

    if (body.task) updatePayload.task = body.task;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.startTime) updatePayload.start_time = body.startTime;
    if (body.endTime) updatePayload.end_time = body.endTime;
    if (body.status) updatePayload.status = body.status;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No changes detected" }, { status: 400 });
    }

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
    console.error("[PATCH_TASK_EXCEPTION]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/* ================= DELETE ================= */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const { error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("[DELETE_TASK_EXCEPTION]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
