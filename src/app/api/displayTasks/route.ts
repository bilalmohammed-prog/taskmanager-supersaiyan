import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  deleted_at: string | null;
};

async function resolveOrganizationId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profileError && profile?.active_organization_id) {
    return profile.active_organization_id;
  }

  const { data: member, error: memberError } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError || !member?.organization_id) return null;
  return member.organization_id;
}

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
    const supabase = createClient<Database>(
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

    const organizationId = await resolveOrganizationId(supabase, user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    /* ================= PARAMS ================= */
    const { searchParams } = new URL(req.url);
    const userId =
      searchParams.get("user_id") ?? searchParams.get("employee_id");


    if (!userId) {
      return NextResponse.json({ tasks: [] });
    }

    const { data: member } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ tasks: [] });
    }



    /* ================= QUERY ================= */
    const { data, error } = await supabase
      .from("assignments")
      .select(
        `
          user_id,
          tasks!inner (
            id,
            title,
            description,
            status,
            due_date,
            deleted_at
          )
        `
      )
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("tasks.organization_id", organizationId)
      .is("tasks.deleted_at", null)
      .order("due_date", { ascending: true, foreignTable: "tasks" });

    if (error) {
      console.error("DB ERROR:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    /* ================= MAP ================= */
    const formattedTasks =
      (data as
        | Array<{ user_id: string; tasks: TaskRow | TaskRow[] | null }>
        | null
      )?.flatMap((row) => {
        const rawTask = row.tasks;
        const task = Array.isArray(rawTask) ? rawTask[0] : rawTask;
        if (!task) return [];

        const legacyStatus =
          task.status === "todo"
            ? "pending"
            : task.status === "in_progress"
              ? "in-progress"
              : task.status === "done"
                ? "completed"
                : task.status ?? "pending";

        return [
          {
            id: task.id,
            employee_id: row.user_id,
            task: task.title ?? "",
            description: task.description ?? "",
            startTime: null,
            endTime: task.due_date,
            status: legacyStatus,
            proof: "",
          },
        ];
      }) ?? [];


    return NextResponse.json({ tasks: formattedTasks });
  } catch (err) {
    console.error("[TASK_ROUTE_EXCEPTION]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
