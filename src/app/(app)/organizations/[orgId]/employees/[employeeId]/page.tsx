"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateTask } from "@/actions/task/update";
import type { TablesUpdate } from "@/lib/types/database";
import { assignTaskToResource } from "@/actions/task/assign";
import { createTask } from "@/actions/task/create";
import { deleteTask as deleteTaskAction } from "@/actions/task/delete";
import EmployeeOverviewModal from "@/components/EmployeeOverviewModal";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";

type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus | null;
  due_date?: string | null;
  description?: string | null;
};

export default function EmployeeDetailPage() {
  const { employeeId, orgId } = useParams<{ employeeId: string; orgId: string }>();
  const { addToast } = useToast();
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
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

      await updateTask(
        editingTask.id,
        {
          title: editTitle,
          status: editStatus,
          due_date: editDueDate || null,
          description: editDescription || null,
        },
        orgId
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: editTitle,
                status: editStatus,
                due_date: editDueDate || null,
                description: editDescription || null,
              }
            : t
        )
      );

      setEditingTask(null);
    } catch{
      addToast("Update failed", "error");
    }finally {
      setUpdating(false);
    }
  }

  async function handleCreate() {
    const trimmed = newTitle.trim();
    if (!trimmed || !newDueDate) return;

    try {
      setCreating(true);

      const created = await createTask(
        trimmed,
        newDescription || "",
        newDueDate,
        orgId,
        null
      );

      await assignTaskToResource(created.id, employeeId);

      setTasks((prev) => [
        ...prev,
        {
          ...created,
          status: created.status as TaskStatus,
        },
      ]);

      setShowCreate(false);
      setNewTitle("");
      setNewStatus("todo");
      setNewDueDate("");
      setNewDescription("");
    } catch (e) {
      console.error(e);
      addToast("Create failed", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm("Delete this task?");
    if (!confirmDelete) return;

    const backup = tasks;
    setDeletingId(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTaskAction(id, orgId);
    } catch (e) {
      console.error(e);
      addToast("Delete failed", "error");
      setTasks(backup);
    } finally {
      setDeletingId(null);
    }
  }

  function updateTitleLocal(id: string, value: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: value } : t)));
  }

  function updateStatusLocal(id: string, value: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: value } : t)));
  }

  function updateDueDateLocal(id: string, value: string | null) {
    const normalized = value === "" ? null : value;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, due_date: normalized } : t)));
  }

  async function commitDueDate(id: string, value: string) {
    const normalized = value === "" ? null : value;
    const old = tasks.find((t) => t.id === id)?.due_date ?? null;
    updateDueDateLocal(id, normalized);
    const ok = await saveTask(id, { due_date: normalized });
    if (!ok) updateDueDateLocal(id, old);
  }

  // ---------- SERVER SAVE ----------

  async function saveTask(id: string, updates: TablesUpdate<"tasks">) {
    try {
      setSavingId(id);
      await updateTask(id, updates, orgId);
      return true;
    } catch (e) {
      console.error(e);
      addToast("Save failed", "error");
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function commitTitle(id: string, newValue: string) {
    const trimmed = newValue.trim();
    if (trimmed.length === 0) return;
    const old = tasks.find((t) => t.id === id)?.title ?? "";
    updateTitleLocal(id, trimmed);
    const ok = await saveTask(id, { title: trimmed });
    if (!ok) updateTitleLocal(id, old);
  }

  async function commitStatus(id: string, value: TaskStatus) {
    const old = tasks.find((t) => t.id === id)?.status ?? null;
    updateStatusLocal(id, value);
    const ok = await saveTask(id, { status: value });
    if (!ok && old) updateStatusLocal(id, old);
  }

  // ---------- LOAD DATA ----------

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmployeeEmail(user?.email || "");

      const { data, error } = await supabase
        .from("assignments")
        .select(`
          task_id,
          tasks!inner (
            id,
            title,
            status,
            due_date,
            description,
            deleted_at
          )
        `)
        .eq("user_id", employeeId)
        .is("tasks.deleted_at", null);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const taskRows = data?.map((row) => ({ ...row.tasks })).filter(Boolean) ?? [];
      setTasks(taskRows);
      setLoading(false);
    }

    loadTasks();
  }, [employeeId]); // ← dependency array prevents infinite loop

  // ---------- UI ----------

  return (
    <div className="mt-6">
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setShowCreate(true)}>
          + Add Task
        </Button>
        <Button variant="outline" onClick={() => setShowOverviewModal(true)}>
          Employee Overview
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th>Status</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-border/40">
                <td className="p-2">
                  <input
                    value={task.title}
                    onChange={(e) => updateTitleLocal(task.id, e.target.value)}
                    onBlur={(e) => commitTitle(task.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.currentTarget.value = task.title;
                        e.currentTarget.blur();
                      }
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    className="bg-transparent border-b border-border hover:border-foreground/40 focus:border-primary outline-none"
                  />
                </td>

                <td>
                  <select
                    value={task.status ?? ""}
                    onChange={(e) => commitStatus(task.id, e.target.value as TaskStatus)}
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
                    value={task.due_date ?? ""}
                    onChange={(e) => updateDueDateLocal(task.id, e.target.value)}
                    onBlur={(e) => commitDueDate(task.id, e.target.value)}
                    className="bg-transparent border-b border-border hover:border-foreground/40 focus:border-primary outline-none"
                  />
                </td>

                <td className="flex gap-2 items-center">
                  {savingId === task.id && (
                    <span className="text-xs text-muted-foreground">Saving…</span>
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
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] space-y-4 rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-medium text-zinc-900">Add Task</h2>
              <p className="text-sm text-zinc-500">
                Create and assign a new task for this employee.
              </p>
            </div>

            <input
              autoFocus
              placeholder="Task title *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />

            <textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="h-24 w-full resize-none rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                disabled={!newTitle.trim() || !newDueDate || creating}
                onClick={handleCreate}
                className="rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-card border border-border p-6 rounded w-[420px] space-y-4 text-foreground">
            <h2 className="text-lg font-semibold">Edit Task</h2>

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded text-foreground"
            />

            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              className="w-full bg-background border border-border p-2 rounded text-foreground"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>

            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded text-foreground"
            />

            <textarea
              placeholder="Description..."
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded text-foreground h-24 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingTask(null)}
                className="px-3 py-1 bg-muted rounded hover:bg-muted/80 text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={updating}
                onClick={handleUpdate}
                className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-40"
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
