import { NextResponse } from "next/server";
import { createClient, User } from "@supabase/supabase-js";

/* ---------- TYPES ---------- */
interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: "todo" | "in_progress" | "blocked" | "done" | "pending" | "in-progress" | "completed";
}

interface TaskTableUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  status?: "todo" | "in_progress" | "blocked" | "done";
}

interface AuthResult {
  user: User;
  token: string;
}

function normalizeStatusInput(
  status?: UpdateTaskRequest["status"]
): "todo" | "in_progress" | "blocked" | "done" | undefined {
  if (!status) return undefined;
  if (status === "pending") return "todo";
  if (status === "in-progress") return "in_progress";
  if (status === "completed") return "done";
  if (
    status === "todo" ||
    status === "in_progress" ||
    status === "blocked" ||
    status === "done"
  ) {
    return status;
  }
  return undefined;
}

function toLegacyStatus(status: string | null): string {
  if (status === "todo") return "pending";
  if (status === "in_progress") return "in-progress";
  if (status === "done") return "completed";
  return status ?? "pending";
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

    if (body.title) updatePayload.title = body.title;
    if (body.description !== undefined)
      updatePayload.description = body.description;
    if (body.dueDate !== undefined) updatePayload.due_date = body.dueDate;
    const normalizedStatus = normalizeStatusInput(body.status);
    if (normalizedStatus) updatePayload.status = normalizedStatus;

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
      .is("deleted_at", null)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: assignment } = await supabase
      .from("assignments")
      .select("user_id")
      .eq("task_id", taskId)
      .maybeSingle();

    return NextResponse.json(
      {
        task: data
          ? {
              employee_id: assignment?.user_id ?? "",
              id: data.id,
              task: data.title,
              description: data.description ?? "",
              startTime: null,
              endTime: data.due_date,
              status: toLegacyStatus(data.status),
              proof: "",
            }
          : null,
      },
      { status: 200 }
    );
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
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", taskId)
      .is("deleted_at", null);

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
