"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

type ProjectStatus = "active" | "paused" | "archived";


/** UI TYPE */
type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
};

/** DB ROW TYPE */
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
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

export default function ProjectsPage() {
  const { orgId } = useParams<{ orgId: string }>();
console.log("ORG", orgId);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
const router = useRouter();
  // ---------- LOAD ----------
  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped: Project[] = (data as ProjectRow[]).map(p => ({
          id: p.id,
          name: p.name,
          status: p.status ?? "active",
          startDate: p.start_date,
          endDate: p.end_date
        }));

        setProjects(mapped);
      }

      setLoading(false);
    }

    if (orgId) load();
  }, [orgId]);

  // ---------- CREATE ----------
  async function handleCreate() {
    if (!name.trim()) return;

    try {
      setCreating(true);

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: name.trim(),
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          organization_id: orgId
        })
        .select()
        .single();

      if (error) throw error;

      const row = data as ProjectRow;

      const newProject: Project = {
        id: row.id,
        name: row.name,
        status: row.status ?? "active",
        startDate: row.start_date,
        endDate: row.end_date
      };

      setProjects(prev => [newProject, ...prev]);

      setShowCreate(false);
      setName("");
      setStartDate("");
      setEndDate("");
      setStatus("active");
    } catch {
      alert("Create failed");
    } finally {
      setCreating(false);
    }
  }

  // ---------- SOFT DELETE ----------
  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;

    const backup = projects;
    setDeletingId(id);
    setProjects(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Delete failed");
      setProjects(backup);
    }

    setDeletingId(null);
  }

  // ---------- UI ----------
  return (
    <div className="mt-6 space-y-6">

      <button
        onClick={() => setShowCreate(true)}
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
      >
        + New Project
      </button>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map(p => (
            <div
  key={p.id}
  onClick={() =>
    router.push(
      `/organizations/${orgId}/projects/${p.id}`
    )
  }
  className="
    bg-gray-900 border border-white/10
    p-4 rounded-xl space-y-2
    cursor-pointer
    hover:border-blue-500/50
    hover:bg-gray-800/80
    transition-all duration-200
    hover:-translate-y-1
  "
>
              <h3 className="font-semibold text-lg">{p.name}</h3>

              <p className="text-xs text-gray-400">
                Status: {p.status}
              </p>

              <p className="text-xs text-gray-500">
                Start: {formatDate(p.startDate)}
              </p>

              <p className="text-xs text-gray-500">
                End: {formatDate(p.endDate)}
              </p>

              <button
  onClick={(e) => {
    e.stopPropagation();
    handleDelete(p.id);
  }}
  className="text-red-400 text-sm"
>
                {deletingId === p.id ? "…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded w-[420px] space-y-4">

            <h2 className="text-lg font-semibold">Create Project</h2>

            <input
              placeholder="Project name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 p-2 rounded border border-gray-700"
            />

            <select
  value={status}
  onChange={e => setStatus(e.target.value as ProjectStatus)}
>
  <option value="active">Active</option>
  <option value="paused">Paused</option>
  <option value="archived">Archived</option>
</select>


            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-gray-800 p-2 rounded border border-gray-700"
            />

            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-gray-800 p-2 rounded border border-gray-700"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 bg-gray-700 rounded"
              >
                Cancel
              </button>

              <button
                disabled={!name.trim() || creating}
                onClick={handleCreate}
                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
