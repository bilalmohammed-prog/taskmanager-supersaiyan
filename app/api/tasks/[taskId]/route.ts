import { NextResponse } from "next/server";
import { createClient, User } from "@supabase/supabase-js";

/* ---------- TYPES ---------- */
interface UpdateTaskRequest {
  task?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: "pending" | "in-progress" | "completed";
}

interface TaskTableUpdate {
  task?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  status?: "pending" | "in-progress" | "completed";
}

interface AuthResult {
  user: User;
  token: string;
}

/* ---------- USER SCOPED CLIENT ---------- */
function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

/* ---------- AUTH ---------- */
async function authenticate(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabase = getUserClient(token);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return { user, token };
}

/* ================= PATCH ================= */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = auth;
    const supabase = getUserClient(token);

    const { taskId } = await params;
    const body: UpdateTaskRequest = await req.json();

    const updatePayload: TaskTableUpdate = {};

    if (body.task) updatePayload.task = body.task;
    if (body.description !== undefined)
      updatePayload.description = body.description;
    if (body.startTime) updatePayload.start_time = body.startTime;
    if (body.endTime) updatePayload.end_time = body.endTime;
    if (body.status) updatePayload.status = body.status;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No changes detected" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* ================= DELETE ================= */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = auth;
    const supabase = getUserClient(token);

    const { taskId } = await params;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[DELETE_TASK_EXCEPTION]:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
