"use client";

import { useOrgRole } from "@/hooks/useOrgRole";
import { createProjectAction } from "@/actions/project/create";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { deleteProject } from "@/actions/project/deleteProject";
import { useToast } from "@/components/providers/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, MoreHorizontal, Plus } from "lucide-react";

type ProjectStatus = "active" | "paused" | "archived";

type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  status: ProjectStatus | null;
  start_date: string | null;
  end_date: string | null;
  organization_id: string;
  created_at: string | null;
  deleted_at: string | null;
};

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

function getStatusBadgeClass(status: ProjectStatus) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  }

  if (status === "paused") {
    return "bg-amber-50 text-amber-700 border-amber-200/60";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200/60";
}

export default function ProjectsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const { addToast } = useToast();
  const role = useOrgRole();
  const canManage = role === "owner" || role === "admin" || role === "manager";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 12;

  const loadProjects = useCallback(
    async (replace = true) => {
      if (!orgId) return;

      try {
        if (replace) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const currentLength = replace ? 0 : projects.length;
        const from = currentLength;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        const mapped = (data as ProjectRow[]).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status ?? "active",
          startDate: p.start_date,
          endDate: p.end_date,
        }));

        setProjects((prev) => (replace ? mapped : [...prev, ...mapped]));
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        console.error("Load projects failed:", err);
        addToast("Failed to load projects", "error");
      } finally {
        if (replace) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [orgId, projects.length, addToast]
  );

  async function handleCreate() {
    if (!name.trim()) return;

    try {
      setCreating(true);

      await createProjectAction({
        name: name.trim(),
        status,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      await loadProjects();

      setShowCreate(false);
      setName("");
      setStartDate("");
      setEndDate("");
      setStatus("active");
    } catch {
      addToast("Create failed", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;

    const backup = projects;
    setDeletingId(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      await deleteProject(id);
      await loadProjects();
    } catch {
      addToast("Delete failed", "error");
      setProjects(backup);
    }

    setDeletingId(null);
  }

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="flex w-full max-w-5xl flex-col space-y-8 pb-16">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase text-indigo-700">
              Project Workspace
            </span>
          </div>
          <h1 className="mt-2 text-[2rem] leading-none font-medium tracking-tight text-zinc-900">
            Projects
          </h1>
          <p className="max-w-lg text-[15px] text-zinc-500">
            Manage timelines, track progress, and coordinate delivery across your team.
          </p>
        </div>

        {canManage && (
          <div className="flex shrink-0">
            <Button
              onClick={() => setShowCreate(true)}
              className="border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-6 rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-900">Project Portfolio</span>
            <span className="text-xs text-zinc-500">{projects.length} visible projects</span>
          </div>

          <div className="mx-2 hidden h-8 w-px bg-zinc-200 sm:block" />

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {projects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200/50"
                  title={project.name}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {projects.length === 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200/50">
                  0
                </div>
              )}
            </div>
            <span className="text-xs text-zinc-500">Recently created</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-zinc-100 pt-4 lg:border-t-0 lg:pt-0">
          <span className="hidden text-xs text-zinc-500 sm:block">Status:</span>
          <div className="inline-flex items-center rounded-md border border-zinc-200/60 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600">
            {hasMore ? "More available" : "Fully loaded"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]"
            >
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-zinc-900">Projects</h2>
            <span className="text-sm text-zinc-500">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(240px,1fr)_140px_160px_160px_60px] items-center gap-4 border-b border-zinc-200/80 bg-zinc-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 md:grid">
              <div>Project</div>
              <div>Status</div>
              <div>Start Date</div>
              <div>End Date</div>
              <div></div>
            </div>

            <div className="divide-y divide-zinc-100">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/organizations/${orgId}/projects/${p.id}`)}
                  className="group relative flex flex-col items-start gap-3 px-4 py-4 transition-colors hover:bg-zinc-50/50 md:grid md:grid-cols-[minmax(240px,1fr)_140px_160px_160px_60px] md:items-center md:gap-4 md:px-6 md:py-3.5"
                >
                  <div className="flex w-full min-w-0 flex-col">
                    <span className="truncate text-[15px] font-medium text-zinc-900">
                      {p.name}
                    </span>
                    <div className="mt-1 flex items-center gap-2 md:hidden">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-zinc-300" />
                      <span className="text-xs text-zinc-500">{formatDate(p.startDate)}</span>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="hidden items-center text-sm text-zinc-500 md:flex">
                    <Calendar className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                    {formatDate(p.startDate)}
                  </div>

                  <div className="hidden items-center text-sm text-zinc-500 md:flex">
                    <Calendar className="mr-1.5 h-3.5 w-3.5 opacity-70" />
                    {formatDate(p.endDate)}
                  </div>

                  <div className="absolute top-4 right-4 flex w-full justify-end md:static md:w-auto">
                    {canManage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 md:opacity-100"
                        aria-label={`Delete ${p.name}`}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {canManage && deletingId === p.id && (
                    <div className="md:hidden">
                      <span className="text-xs text-zinc-500">Deleting...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => loadProjects(false)}
            disabled={loadingMore}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] space-y-4 rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-medium text-zinc-900">Create Project</h2>

            <input
              placeholder="Project name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>

              <button
                disabled={!name.trim() || creating}
                onClick={handleCreate}
                className="rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
