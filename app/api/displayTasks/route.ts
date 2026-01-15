import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    // 1. Authenticate Session - Use a check that ensures the user exists
    const session = await getServerSession(authOptions);
    
    // We check for user to ensure the session is active
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract Query Parameters
    const { searchParams } = new URL(req.url);
    const empID = searchParams.get("empID");

    if (!empID) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    // 3. Database Query
    // Using supabaseAdmin bypasses RLS safely because we verified the session above.
    const { data: tasks, error } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("emp_id", empID); // Ensure your DB column is named emp_id
      

    if (error) {
      console.error("[DATABASE_ERROR]:", error.message);
      // Return the error message in JSON so the frontend doesn't get "Unexpected end of input"
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /** * 4. Professional Mapping
     * Your frontend expects 'task', 'startTime', and 'endTime'.
     * Postgres returns 'task_title', 'start_time', and 'end_time'.
     * We map them here so the functionality remains identical for the UI.
     */
    const formattedTasks = (tasks || []).map((t) => ({
      ...t,
      task: t.task_title || t.task, // Fallback in case of naming mismatch
      startTime: t.start_time,
      endTime: t.end_time,
      proof: t.proof_url
    }));

    return NextResponse.json({ tasks: formattedTasks }, { status: 200 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[DISPLAY_TASKS_EXCEPTION]:", msg);

    // Always return JSON
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}