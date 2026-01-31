import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

interface TaskRow {
  id: string;
  task_title: string | null;
  start_time: string | null;
  end_time: string | null;
  proof_url: string | null;
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await getSupabaseServer();

    // 1️⃣ Authenticate via Supabase Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ RLS-enforced query (NO filters)
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        id,
        task_title,
        start_time,
        end_time,
        proof_url
      `);

    if (error) {
      console.error("[TASK_QUERY_ERROR]", error.message);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    // 3️⃣ Map DB fields → frontend contract
    const formattedTasks = (data ?? []).map((t: TaskRow) => ({
      id: t.id,
      task: t.task_title,
      startTime: t.start_time,
      endTime: t.end_time,
      proof: t.proof_url,
    }));

    return NextResponse.json(
      { tasks: formattedTasks },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error";

    console.error("[TASK_ROUTE_EXCEPTION]", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
