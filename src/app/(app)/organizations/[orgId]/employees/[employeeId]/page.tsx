"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateTask } from "@/actions/task/update";
import type { TablesUpdate } from "@/lib/supabase/types";

type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus | null;
  due_date?: string | null;
  allocated_hours?: number | null;
  start_time?: string | null;
  end_time?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

export default function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // ---------- STATE HELPERS ----------

  function updateTitleLocal(id: string, value: string) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, title: value } : t))
    );
  }

  function updateStatusLocal(id: string, value: TaskStatus) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, status: value } : t))
    );
  }

  // ---------- SERVER SAVE ----------

  async function saveTask(id: string, updates: TablesUpdate<"tasks">) {
    if (!orgId) {
      alert("No organization selected");
      return false;
    }

    try {
      setSavingId(id);
      await updateTask(id, updates, orgId);
      return true;
    } catch (e) {
      console.error(e);
      alert("Save failed");
      return false;
    } finally {
      setSavingId(null);
    }
  }

  // ---------- COMMIT HANDLERS ----------

  async function commitTitle(id: string, newValue: string) {
    const trimmed = newValue.trim();
    if (trimmed.length === 0) return;

    const old = tasks.find(t => t.id === id)?.title ?? "";

    updateTitleLocal(id, trimmed);

    const ok = await saveTask(id, { title: trimmed });
    if (!ok) updateTitleLocal(id, old);
  }

  async function commitStatus(id: string, value: TaskStatus) {
    const old = tasks.find(t => t.id === id)?.status ?? null;

    updateStatusLocal(id, value);

    const ok = await saveTask(id, { status: value });
    if (!ok && old) updateStatusLocal(id, old);
  }

  // ---------- CRUD ----------

  async function deleteTask(id: string) {
    const res = await fetch("/api/tasks/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }

  async function openCreateModal() {
    const title = prompt("Task title?");
    if (!title) return;

    const res = await fetch("/api/tasks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });

    const newTask = await res.json();
    setTasks(prev => [...prev, newTask]);
  }

  // ---------- LOAD DATA ----------

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);

      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .single();

      setOrgId(org?.id ?? null);

      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", employeeId)
        .single();

      setProfile(p);

      const { data, error } = await supabase
        .from("resource_assignments")
        .select(`
          allocated_hours,
          start_time,
          end_time,
          tasks (
            id,
            title,
            status,
            due_date
          )
        `)
        .eq("resource_id", employeeId);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const taskRows =
        data?.map(row => ({
          ...row.tasks,
          allocated_hours: row.allocated_hours,
          start_time: row.start_time,
          end_time: row.end_time
        })).filter(Boolean) ?? [];

      setTasks(taskRows);
      setLoading(false);
    }

    loadTasks();
  }, [employeeId]);

  // ---------- UI ----------

  return (
    <div className="mt-6">
      <button
        onClick={openCreateModal}
        className="mb-4 px-4 py-2 bg-blue-600 rounded"
      >
        + Add Task
      </button>

      <table className="w-full border-collapse text-sm">
        <thead className="text-gray-400 border-b border-white/10">
          <tr>
            <th className="p-2 text-left">Title</th>
            <th>Status</th>
            <th>Due</th>
            <th>Hours</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {tasks.map(task => (
            <tr key={task.id} className="border-b border-white/5">
              <td className="p-2">
                <input
                  disabled={!orgId}
                  value={task.title}
                  onChange={e =>
                    updateTitleLocal(task.id, e.target.value)
                  }
                  onBlur={e =>
                    commitTitle(task.id, e.target.value)
                  }
                  onKeyDown={e => {
                    if (e.key === "Escape") {
                      e.currentTarget.value = task.title;
                      e.currentTarget.blur();
                    }
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-blue-500 outline-none"
                />
              </td>

              <td>
                <select
                  disabled={!orgId}
                  value={task.status ?? ""}
                  onChange={e =>
                    commitStatus(
                      task.id,
                      e.target.value as TaskStatus
                    )
                  }
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </td>

              <td>{formatDate(task.due_date)}</td>
              <td>{task.allocated_hours ?? 0}</td>

              <td className="flex gap-2 items-center">
                {savingId === task.id && (
                  <span className="text-xs text-gray-400">
                    Saving…
                  </span>
                )}
                <button onClick={() => deleteTask(task.id)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
