"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateTask } from "@/actions/task/update";
import type { TablesUpdate } from "@/lib/supabase/types";

import { createTask } from "@/actions/task/create";
import { deleteTask as deleteTaskAction } from "@/actions/task/delete";

import { listTasks } from "@/actions/task/list";

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
const [newDueDate, setNewDueDate] = useState<string>("");


  const { employeeId } = useParams<{ employeeId: string }>();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
const [newTitle, setNewTitle] = useState("");
const [newStatus, setNewStatus] = useState<TaskStatus>("todo");
const [creating, setCreating] = useState(false);
const [deletingId, setDeletingId] = useState<string | null>(null);




  // ---------- STATE HELPERS ----------

async function handleCreate() {
  const trimmed = newTitle.trim();
  if (!trimmed) return;

  try {
    setCreating(true);

    if (!orgId) {
  alert("No organization selected");
  return;
}

const created = await createTask(
  trimmed,
  undefined,
  newDueDate || null,
  orgId
);


    setTasks(prev => [
      ...prev,
      {
        ...created,
        status: created.status as TaskStatus,
      }
    ]);

    setShowCreate(false);
    setNewTitle("");
    setNewStatus("todo");
    setNewDueDate("");
  } catch (e) {
    console.error(e);
    alert("Create failed");
  } finally {
    setCreating(false);
  }
}

async function handleDelete(id: string) {
  const data = await listTasks(employeeId);
  if (!orgId) {
    alert("No organization selected");
    return;
  }

  const confirmDelete = confirm("Delete this task?");
  if (!confirmDelete) return;

  const backup = tasks;
  setDeletingId(id);
  setTasks(prev => prev.filter(t => t.id !== id));

  try {
    await deleteTaskAction(id, orgId);
  } catch (e) {
    console.error(e);
    alert("Delete failed");
    setTasks(backup);
  } finally {
    setDeletingId(null);
  }
}



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
          tasks!inner (
  id,
  title,
  status,
  due_date,
  deleted_at
)

        `)
        .eq("resource_id", employeeId)
.is("tasks.deleted_at", null);


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
  onClick={() => setShowCreate(true)}
  className="mb-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
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
                <button onClick={() => handleDelete(task.id)}>
  {deletingId === task.id ? "…" : "🗑"}
</button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>

          {showCreate && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-gray-900 p-6 rounded w-96 space-y-4">
      <h2 className="text-lg font-semibold">Create Task</h2>

      <input
        autoFocus
        placeholder="Task title"
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700"
      />
      <input
  type="date"
  value={newDueDate}
  onChange={e => setNewDueDate(e.target.value)}
  className="w-full bg-gray-800 p-2 rounded border border-gray-700"
/>

      <select
        value={newStatus}
        onChange={e => setNewStatus(e.target.value as TaskStatus)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700"
      >
        <option value="todo">Todo</option>
        <option value="in_progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
      </select>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowCreate(false)}
          className="px-3 py-1 bg-gray-700 rounded"
        >
          Cancel
        </button>

        <button
          disabled={!newTitle.trim() || creating}
          onClick={handleCreate}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
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
