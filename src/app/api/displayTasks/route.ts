import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TaskRow = {
  id: string;
  task: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  proof: string | null;
  employee_id: string | null;
};

export async function GET(req: Request): Promise<NextResponse> {
  try {


    /* ================= AUTH HEADER ================= */
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    /* ================= SUPABASE CLIENT ================= */
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`, // critical for RLS
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    /* ================= AUTH USER ================= */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();



    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ================= PARAMS ================= */
    const { searchParams } = new URL(req.url);
    const employee_id = searchParams.get("employee_id");


    if (!employee_id) {
      return NextResponse.json({ tasks: [] });
    }



    /* ================= QUERY ================= */
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("employee_id", employee_id)

      .order("end_time", { ascending: true });

    if (error) {
      console.error("DB ERROR:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    /* ================= MAP ================= */
    const formattedTasks =
      (data as TaskRow[] | null)?.map((t) => ({
        id: t.id,
        employee_id: t.employee_id,

        task: t.task ?? "",
        description: t.description ?? "",
        startTime: t.start_time,
        endTime: t.end_time,
        status: t.status ?? "pending",
        proof: t.proof ?? "",
      })) ?? [];


    return NextResponse.json({ tasks: formattedTasks });
  } catch (err) {
    console.error("[TASK_ROUTE_EXCEPTION]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
