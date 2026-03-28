import { NextResponse } from "next/server";
import { fail } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);

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
  } catch (err) {
    return fail(err);
  }
}
