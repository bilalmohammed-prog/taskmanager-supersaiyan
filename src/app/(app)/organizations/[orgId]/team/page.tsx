import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { addMember } from "@/actions/organization/addMember";
import { listOrgMembers } from "@/actions/organization/listOrgMembers";
import { authorize } from "@/lib/auth/authorization";
import { uuidSchema } from "@/lib/validation/common";
import type { Database } from "@/lib/types/database";
import TeamTabsClient, { TeamMemberRow, TeamWorkloadRow } from "./team-tabs-client";

type RoleType = Database["public"]["Enums"]["role_type"];

const roleOptions: RoleType[] = ["owner", "admin", "manager", "employee", "viewer"];

type TeamSearchParams = {
  tab?: "members" | "workload";
  status?: "success" | "error";
  message?: string;
};

function encodeQueryMessage(message: string): string {
  return encodeURIComponent(message);
}

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<TeamSearchParams>;
}) {
  const { orgId } = await params;
  const query = await searchParams;

  const ctx = await requireOrgContext({ organizationId: orgId });

  const [membersResult, orgMemberRowsResult, assignmentRowsResult] = await Promise.all([
    listOrgMembers(ctx.organizationId),
    ctx.supabase
      .from("org_members")
      .select("user_id,role,profiles!org_members_user_id_fkey(full_name,username)")
      .eq("organization_id", ctx.organizationId),
    ctx.supabase
      .from("assignments")
      .select(
        `
          user_id,
          allocated_hours,
          tasks!inner (
            id,
            status,
            deleted_at
          )
        `
      )
      .eq("organization_id", ctx.organizationId)
      .is("tasks.deleted_at", null),
  ]);

  const baseMembers = membersResult.data ?? [];
  const orgMemberRows = orgMemberRowsResult.data ?? [];

  const baseMemberByUserId = new Map(baseMembers.map((member) => [member.user_id, member.name]));

  const members: TeamMemberRow[] = orgMemberRows.map((row) => ({
    user_id: row.user_id,
    name:
      baseMemberByUserId.get(row.user_id) ??
      row.profiles?.full_name ??
      "Unknown",
    email: row.profiles?.username ?? null,
    role: row.role,
  }));

  type AssignmentRow = {
    user_id: string;
    allocated_hours: number | null;
    tasks: { id: string; status: string | null; deleted_at: string | null };
  };

  const statsByUserId = new Map<
    string,
    { totalTasks: number; completedTasks: number; allocatedHours: number }
  >();

  for (const row of ((assignmentRowsResult.data ?? []) as AssignmentRow[])) {
    const current = statsByUserId.get(row.user_id) ?? {
      totalTasks: 0,
      completedTasks: 0,
      allocatedHours: 0,
    };

    current.totalTasks += 1;
    if (row.tasks.status === "done") {
      current.completedTasks += 1;
    }
    current.allocatedHours += row.allocated_hours ?? 0;

    statsByUserId.set(row.user_id, current);
  }

  const workload: TeamWorkloadRow[] = members.map((member) => {
    const stats = statsByUserId.get(member.user_id) ?? {
      totalTasks: 0,
      completedTasks: 0,
      allocatedHours: 0,
    };

    return {
      user_id: member.user_id,
      name: member.name,
      email: member.email,
      role: member.role,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      allocatedHours: stats.allocatedHours,
    };
  });

  async function addMemberMutation(formData: FormData) {
    "use server";
    const organizationId = String(formData.get("organizationId") ?? "").trim();
    const userId = String(formData.get("userId") ?? "").trim();
    const role = String(formData.get("role") ?? "employee") as RoleType;

    const validOrgId = uuidSchema.safeParse(organizationId);
    const validUserId = uuidSchema.safeParse(userId);

    if (!validOrgId.success || !validUserId.success) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("Please enter valid UUIDs for organization and user")}`
      );
    }

    const result = await addMember({
      organizationId,
      userId,
      role,
    });

    if (result.error) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage(result.error.message)}`
      );
    }

    revalidatePath(`/organizations/${organizationId}/team`);
    redirect(
      `/organizations/${organizationId}/team?tab=members&status=success&message=${encodeQueryMessage(
        result.data.created
          ? "Member added successfully"
          : "User is already a member of this organization"
      )}`
    );
  }

  async function updateRoleMutation(formData: FormData) {
    "use server";
    const organizationId = String(formData.get("organizationId") ?? "").trim();
    const userId = String(formData.get("userId") ?? "").trim();
    const role = String(formData.get("role") ?? "employee") as RoleType;

    const validOrgId = uuidSchema.safeParse(organizationId);
    const validUserId = uuidSchema.safeParse(userId);

    if (!validOrgId.success || !validUserId.success) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("Invalid org/member id")}`
      );
    }

    const orgCtx = await requireOrgContext({ organizationId });
    authorize("manage_members", "organization", { role: orgCtx.role });

    const { data: targetMember, error: targetError } = await orgCtx.supabase
      .from("org_members")
      .select("role")
      .eq("organization_id", orgCtx.organizationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (targetError || !targetMember) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("Member not found")}`
      );
    }

    if (orgCtx.role === "admin" && (targetMember.role === "owner" || targetMember.role === "admin")) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("Admins cannot change owner/admin roles")}`
      );
    }

    if (targetMember.role === "owner" && role !== "owner") {
      const { count } = await orgCtx.supabase
        .from("org_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgCtx.organizationId)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        redirect(
          `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("At least one owner is required")}`
        );
      }
    }

    const { error: updateError } = await orgCtx.supabase
      .from("org_members")
      .update({ role })
      .eq("organization_id", orgCtx.organizationId)
      .eq("user_id", userId);

    if (updateError) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage(updateError.message)}`
      );
    }

    revalidatePath(`/organizations/${organizationId}/team`);
    redirect(
      `/organizations/${organizationId}/team?tab=members&status=success&message=${encodeQueryMessage("Role updated")}`
    );
  }

  async function removeMemberMutation(formData: FormData) {
    "use server";
    const organizationId = String(formData.get("organizationId") ?? "").trim();
    const userId = String(formData.get("userId") ?? "").trim();

    const validOrgId = uuidSchema.safeParse(organizationId);
    const validUserId = uuidSchema.safeParse(userId);

    if (!validOrgId.success || !validUserId.success) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("Invalid org/member id")}`
      );
    }

    const orgCtx = await requireOrgContext({ organizationId });
    authorize("manage_members", "organization", { role: orgCtx.role });

    if (orgCtx.userId === userId) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("You cannot remove yourself")}`
      );
    }

    const { data: targetMember, error: targetError } = await orgCtx.supabase
      .from("org_members")
      .select("role")
      .eq("organization_id", orgCtx.organizationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (targetError || !targetMember) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("Member not found")}`
      );
    }

    if (orgCtx.role === "admin" && (targetMember.role === "owner" || targetMember.role === "admin")) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("Admins cannot remove owner/admin members")}`
      );
    }

    if (targetMember.role === "owner") {
      const { count } = await orgCtx.supabase
        .from("org_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgCtx.organizationId)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        redirect(
          `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage("At least one owner is required")}`
        );
      }
    }

    const { error: deleteError } = await orgCtx.supabase
      .from("org_members")
      .delete()
      .eq("organization_id", orgCtx.organizationId)
      .eq("user_id", userId);

    if (deleteError) {
      redirect(
        `/organizations/${organizationId}/team?tab=members&status=error&message=${encodeQueryMessage(deleteError.message)}`
      );
    }

    revalidatePath(`/organizations/${organizationId}/team`);
    redirect(
      `/organizations/${organizationId}/team?tab=members&status=success&message=${encodeQueryMessage("Member removed")}`
    );
  }

  return (
    <div className="w-full max-w-6xl p-6">
      <TeamTabsClient
        organizationId={ctx.organizationId}
        selectedTab={query.tab === "workload" ? "workload" : "members"}
        status={query.status}
        message={query.message}
        members={members}
        workload={workload}
        roleOptions={roleOptions}
        currentRole={ctx.role}
        addMemberAction={addMemberMutation}
        updateRoleAction={updateRoleMutation}
        removeMemberAction={removeMemberMutation}
      />
    </div>
  );
}
