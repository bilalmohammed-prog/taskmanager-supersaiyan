import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeStatusInput(
  status?: string
): "todo" | "in_progress" | "blocked" | "done" {
  if (!status) return "todo";
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
  return "todo";
}

function toLegacyStatus(status: string | null): string {
  if (status === "todo") return "pending";
  if (status === "in_progress") return "in-progress";
  if (status === "done") return "completed";
  return status ?? "pending";
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // USER-SCOPED CLIENT
    const supabase = createClient(
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      user_id,
      project_id,
      organization_id,
      title,
      description,
      due_date,
      dueDate,
      status,
    } = body;

    if (!user_id || !organization_id || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          id: id ?? undefined,
          project_id: project_id ?? null,
          organization_id,
          title,
          description: description ?? "",
          due_date: dueDate ?? due_date ?? null,
          created_by: user.id,
          deleted_at: null,
          status: normalizeStatusInput(status),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error: assignmentError } = await supabase
      .from("assignments")
      .insert({
        task_id: data.id,
        user_id,
        organization_id,
      });

    if (assignmentError) {
      return NextResponse.json({ error: assignmentError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: "Task created",
        task: {
          employee_id: user_id,
          id: data.id,
          task: data.title,
          description: data.description ?? "",
          startTime: null,
          endTime: data.due_date,
          status: toLegacyStatus(data.status),
          proof: "",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
