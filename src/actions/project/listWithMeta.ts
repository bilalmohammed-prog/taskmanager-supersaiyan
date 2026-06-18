"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";

export type ProjectWithMeta = {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  startDate: string | null;
  endDate: string | null;
  memberCount: number;
  completed: number;
  total: number;
};

type ListProjectsWithMetaParams = {
  organizationId?: string | null;
  pageSize?: number;
  pageOffset?: number;
  search?: string;   // optional
  startDate?: string | null;
  dueDate?: string | null;
  status?: "all" | "active" | "paused" | "archived";
  sortBy?: "name" | "progress" | "start_date" | "end_date";
  sortOrder?: "asc" | "desc";
};

type ProjectWithMetaRow = {
  id: string;
  name: string;
  status: "active" | "paused" | "archived" | null;
  start_date: string | null;
  end_date: string | null;
  member_count: number | null;
  completed: number | null;
  total: number | null;
  total_count: number | null;
};

export async function listProjectsWithMetaAction(
  params: ListProjectsWithMetaParams = {}
): Promise<{ projects: ProjectWithMeta[]; totalCount: number }> {
  const ctx = await requireOrgContext({ organizationId: params.organizationId ?? undefined });
  const pageSize = params.pageSize ?? 12;
  const pageOffset = params.pageOffset ?? 0;
  const search = params.search?.trim() || "";

  const { data, error } = await ctx.supabase.rpc("list_projects_with_meta", {
    org_uuid: ctx.organizationId,
    page_size: pageSize,
    page_offset: pageOffset,
    search_query: search,
    start_date_from: params.startDate || undefined,
    due_date_to: params.dueDate || undefined,
    status_filter: params.status || "all",
    sort_by: params.sortBy || "name",
    sort_order: params.sortOrder || "asc",
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as ProjectWithMetaRow[] | null) ?? [];

return {
  projects: rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status ?? "active",
    startDate: row.start_date,
    endDate: row.end_date,
    memberCount: Number(row.member_count ?? 0),
    completed: Number(row.completed ?? 0),
    total: Number(row.total ?? 0),
  })),
  totalCount: Number(rows[0]?.total_count ?? 0),
};
}
