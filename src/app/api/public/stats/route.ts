import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = supabaseAdmin;

  const [{ count: orgCount }, { count: taskCount }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  return NextResponse.json({
    organizations: orgCount ?? 0,
    activeTasks: taskCount ?? 0,
  });
}