import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

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

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // USER-SCOPED CLIENT
    const supabase = createClient<Database>(
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
      title,
      description,
      due_date,
      dueDate,
      status,
    } = body;

    if (!user_id || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const organizationId = await resolveOrganizationId(supabase, user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const { data: assigneeMember } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("user_id", user_id)
      .maybeSingle();

    if (!assigneeMember) {
      return NextResponse.json({ error: "Assignee is not in your organization" }, { status: 400 });
    }

    let validatedProjectId: string | null = null;
    if (project_id) {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", project_id)
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .maybeSingle();

      if (projectError) {
        return NextResponse.json({ error: projectError.message }, { status: 400 });
      }

      if (!project) {
        return NextResponse.json(
          { error: "Project does not belong to your organization" },
          { status: 403 }
        );
      }

      validatedProjectId = project.id;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          id: id ?? undefined,
          project_id: validatedProjectId,
          organization_id: organizationId,
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
        organization_id: organizationId,
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
