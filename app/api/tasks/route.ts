import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Define a strict interface for the Task
interface TaskRequest {
  empID: string;
  id: string;
  task: string;
  description?: string;
  startTime: string;
  endTime: string;
  status?: "pending" | "completed" | "in-progress";
  proof?: string;
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate the Session (The Gateway)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Parse and Validate Body
    const body: TaskRequest = await req.json();
    const { empID, id, task, description, startTime, endTime, status, proof } = body;

    // Required field validation
    if (!empID || !id || !task || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: empID, id, task, startTime, and endTime are mandatory." },
        { status: 400 }
      );
    }

    // 3. Database Operation using Admin Client
    // We map the object explicitly to avoid mass-assignment vulnerabilities
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert([
        {
          id,
          emp_id: empID,
          task: task,
          description: description || "",
          start_time: startTime,
          end_time: endTime,
          status: status || "pending",
          proof: proof || "",

        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Insertion Error:", error.message);
      return NextResponse.json({ error: "Database operation failed" }, { status: 400 });
    }

    // 4. Success Response
    return NextResponse.json(
      { message: "Task successfully created", task: data },
      { status: 201 }
    );

  } catch (err) {
    // Strict Error Handling
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Task API Catch Block:", message);

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}