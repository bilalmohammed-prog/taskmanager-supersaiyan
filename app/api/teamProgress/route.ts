import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
}
type EmpRow = {
  user_id: string;
  name: string;
  email: string | null;
  manager_id: string;
};

type TaskJoinRow = {
  user_id: string;
  status: string;
  empid: EmpRow | EmpRow[] | null;
};


export async function GET(req: Request) {
    
  try {
    /* ---------- AUTH HEADER ---------- */
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = getUserClient(token);

    /* ---------- GET LOGGED USER ---------- */
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const managerId = user.id;
console.log("Manager UID:", user.id);

    /* ---------- JOIN TASKS WITH EMPID ---------- */
   const { data, error } = await supabase
  .from("tasks")
  .select(`
    user_id,
    status,
    empid:fk_tasks_emp!inner (
      user_id,
      name,
      email,
      manager_id
    )
  `)
  .eq("empid.manager_id", managerId);


      console.log("RAW DATA:", data);

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    /* ---------- AGGREGATE ---------- */
    type Stat = {
  total: number;
  completed: number;
  name: string;
  email: string;
};

const statsMap: Record<string, Stat> = {};

data.forEach((row) => {
  const empRaw = row.empid as unknown;

  const emp =
    Array.isArray(empRaw) ? empRaw[0] : empRaw;

  if (!emp || !emp.user_id) return;

  if (!statsMap[emp.user_id]) {
    statsMap[emp.user_id] = {
      total: 0,
      completed: 0,
      name: emp.name,
      email: emp.email ?? "N/A",
    };
  }

  statsMap[emp.user_id].total += 1;

  if (row.status === "completed") {
    statsMap[emp.user_id].completed += 1;
  }
});


const result = Object.values(statsMap);

console.log("FINAL RESULT:", result);

return NextResponse.json(result);   // <---- THIS is what frontend needs

  } catch (err) {
    console.error("[MANAGER_PROGRESS_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
