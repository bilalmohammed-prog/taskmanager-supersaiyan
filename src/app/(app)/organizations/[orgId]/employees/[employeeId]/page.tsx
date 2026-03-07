"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateTask } from "@/actions/task/update";
import type { TablesUpdate } from "@/lib/supabase/types";
import { assignTaskToResource } from "@/actions/task/assign";

import { createTask } from "@/actions/task/create";
import { deleteTask as deleteTaskAction } from "@/actions/task/delete";

import { listTasks } from "@/actions/task/list";
import { deleteTask as deleteTaskApi } from "@/lib/api";
import { getEmployeeOverview } from "@/lib/api";
import EmployeeOverviewModal from "@/components/EmployeeOverviewModal";

type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus | null;
  due_date?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};


type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type EmployeeOverview = {
  empID: string | null;
  name: string | null;
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
  const [employeeEmail, setEmployeeEmail] = useState<string>("");
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
const [newTitle, setNewTitle] = useState("");
const [newStatus, setNewStatus] = useState<TaskStatus>("todo");
const [creating, setCreating] = useState(false);
const [deletingId, setDeletingId] = useState<string | null>(null);

const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
const [editTitle, setEditTitle] = useState("");
const [editStatus, setEditStatus] = useState<TaskStatus>("todo");
const [editDueDate, setEditDueDate] = useState("");
const [editDescription, setEditDescription] = useState("");
const [updating, setUpdating] = useState(false);

const [newDescription, setNewDescription] = useState("");


  // ---------- STATE HELPERS ----------

function openEdit(task: TaskRow) {
  setEditingTask(task);
  setEditTitle(task.title);
  setEditStatus(task.status ?? "todo");
  setEditDueDate(task.due_date ?? "");
  setEditDescription(task.description ?? "");
}
async function handleUpdate() {
  if (!editingTask || !orgId) return;

  try {
    setUpdating(true);

    await updateTask(editingTask.id, {
      title: editTitle,
      status: editStatus,
      due_date: editDueDate || null,
      description: editDescription || null
    }, orgId);

    // update local UI
    setTasks(prev =>
      prev.map(t =>
        t.id === editingTask.id
          ? {
              ...t,
              title: editTitle,
              status: editStatus,
              due_date: editDueDate || null,
              description: editDescription || null
            }
          : t
      )
    );

    setEditingTask(null);
  } catch (e) {
    alert("Update failed");
  } finally {
    setUpdating(false);
  }
}

async function handleCreate() {
  const trimmed = newTitle.trim();

  if (!trimmed || !newDueDate) return;

  try {
    setCreating(true);

    if (!orgId) {
      alert("No organization selected");
      return;
    }

    const created = await createTask(
      trimmed,
      newDescription || "",
      newDueDate,
      orgId,
      null
      
    );

await assignTaskToResource(created.id, employeeId);

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
    setNewDescription("");

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
function updateDueDateLocal(id: string, value: string | null) {
  const normalized = value === "" ? null : value;

  setTasks(prev =>
    prev.map(t => (t.id === id ? { ...t, due_date: normalized } : t))
  );
}


async function commitDueDate(id: string, value: string) {
  const normalized = value === "" ? null : value;

  const old = tasks.find(t => t.id === id)?.due_date ?? null;

  updateDueDateLocal(id, normalized);

  const ok = await saveTask(id, { due_date: normalized });
  if (!ok) updateDueDateLocal(id, old);
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
    try {
      await deleteTaskApi(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task", err);
      // Could add error handling UI here
    }
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

      // Get current user's email for employee overview
      const { data: { user } } = await supabase.auth.getUser();
      setEmployeeEmail(user?.email || "");

      const { data, error } = await supabase
        .from("resource_assignments")
        .select(`
          start_time,
          end_time,
          tasks!inner (
  id,
  title,
  status,
  due_date,
  description,
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
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          + Add Task
        </button>
        <button
          onClick={() => setShowOverviewModal(true)}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Employee Overview
        </button>
      </div>


      <table className="w-full border-collapse text-sm">
        <thead className="text-gray-400 border-b border-white/10">
          <tr>
            <th className="p-2 text-left">Title</th>
            <th>Status</th>
            <th>Due</th>

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

              <td>
  <input
    type="date"
    disabled={!orgId}
    value={task.due_date ?? ""}
    onChange={e =>
      updateDueDateLocal(task.id, e.target.value)
    }
    onBlur={e =>
      commitDueDate(task.id, e.target.value)
    }
    className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-blue-500 outline-none"
  />
</td>



              <td className="flex gap-2 items-center">
                {savingId === task.id && (
                  <span className="text-xs text-gray-400">
                    Saving…
                  </span>
                )}
                <button onClick={() => openEdit(task)}>✏️</button>

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
    <div className="bg-gray-900 p-6 rounded w-[420px] space-y-4">
      <h2 className="text-lg font-semibold">Create Task</h2>

      {/* TITLE (REQUIRED) */}
      <input
        autoFocus
        placeholder="Task title *"
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700"
      />

      {/* DUE DATE (REQUIRED) */}
      <input
        type="date"
        value={newDueDate}
        onChange={e => setNewDueDate(e.target.value)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700"
      />

      {/* DESCRIPTION */}
      <textarea
        placeholder="Description (optional)"
        value={newDescription}
        onChange={e => setNewDescription(e.target.value)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700 h-24 resize-none"
      />

      {/* STATUS */}
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
          disabled={!newTitle.trim() || !newDueDate || creating}
          onClick={handleCreate}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-40"
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  </div>
)}

{editingTask && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-gray-900 p-6 rounded w-[420px] space-y-4">
      <h2 className="text-lg font-semibold">Edit Task</h2>

      <input
        value={editTitle}
        onChange={e => setEditTitle(e.target.value)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700"
      />

      <select
        value={editStatus}
        onChange={e => setEditStatus(e.target.value as TaskStatus)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700"
      >
        <option value="todo">Todo</option>
        <option value="in_progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
      </select>

      <input
        type="date"
        value={editDueDate}
        onChange={e => setEditDueDate(e.target.value)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700"
      />

      <textarea
        placeholder="Description..."
        value={editDescription}
        onChange={e => setEditDescription(e.target.value)}
        className="w-full bg-gray-800 p-2 rounded border border-gray-700 h-24 resize-none"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setEditingTask(null)}
          className="px-3 py-1 bg-gray-700 rounded"
        >
          Cancel
        </button>

        <button
          disabled={updating}
          onClick={handleUpdate}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
        >
          {updating ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  </div>
)}

      <EmployeeOverviewModal
        employeeId={employeeId}
        employeeEmail={employeeEmail}
        isOpen={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
      />
    </div>
  );
}
