import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    /* 1️⃣ AUTH VIA TOKEN */
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* 2️⃣ PARSE BODY */
    const body: TaskRequest = await req.json();
    const { empID, id, task, description, startTime, endTime, status, proof } = body;

    if (!empID || !id || !task || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* 3️⃣ INSERT */
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert([
        {
          id,
          emp_id: empID,
          task,
          description: description ?? "",
          start_time: startTime,
          end_time: endTime,
          status: status ?? "pending",
          proof: proof ?? "",
          
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error.message);
      return NextResponse.json({ error: "Database failed" }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Task created", task: data },
      { status: 201 }
    );

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
