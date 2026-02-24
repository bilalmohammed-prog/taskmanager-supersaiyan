"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { listTasksByProject } from "@/actions/task/listByProject";
import { updateTask } from "@/actions/task/update";
import { createTask } from "@/actions/task/create";
import { deleteTask as deleteTaskAction } from "@/actions/task/delete";
import type { Tables, Enums } from "@/lib/supabase/types";
import type { TablesUpdate } from "@/lib/supabase/types";

type Task = Tables<"tasks">;
type TaskStatus = Enums<"task_status">;


export default function ProjectWorkspacePage() {
  const { orgId, projectId } = useParams<{
    orgId: string;
    projectId: string;
  }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  // ---------- LOAD ----------
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await listTasksByProject(
        projectId,
        orgId
      );
      setTasks(data as Task[]);
      setLoading(false);
    }

    if (projectId && orgId) load();
  }, [projectId, orgId]);

  // ---------- UPDATE ----------
 

async function updateLocal(
  id: string,
  updates: TablesUpdate<"tasks">
) {
  await updateTask(id, updates, orgId);
}

  // ---------- CREATE ----------
  async function handleCreate() {
    if (!title.trim() || !dueDate) return;

    try {
      setCreating(true);

      const created = await createTask(
        title.trim(),
        "",
        dueDate,
        orgId,
        projectId // IMPORTANT
      );

      setTasks(prev => [created as Task, ...prev]);

      setTitle("");
      setDueDate("");
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  }

  // ---------- DELETE ----------
  async function handleDelete(id: string) {
    const backup = tasks;
    setTasks(prev =>
      prev.filter(t => t.id !== id)
    );

    try {
      await deleteTaskAction(id, orgId);
    } catch {
      setTasks(backup);
    }
  }

  // ---------- UI ----------
  return (
    <div className="mt-6 space-y-4">

      <button
        onClick={() => setShowCreate(true)}
        className="px-4 py-2 bg-blue-600 rounded"
      >
        + Add Task
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Title</th>
              <th>Status</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>
                  <input
                    value={task.title}
                    onChange={e =>
                      updateLocal(task.id, {
                        title: e.target.value
                      })
                    }
                    className="bg-transparent"
                  />
                </td>

                <td>
                  <select
                    value={task.status ?? "todo"}
                    onChange={e =>
                      updateLocal(task.id, {
                        status:
                          e.target
                            .value as TaskStatus
                      })
                    }
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">
                      In Progress
                    </option>
                    <option value="blocked">
                      Blocked
                    </option>
                    <option value="done">Done</option>
                  </select>
                </td>

                <td>
                  <input
                    type="date"
                    value={task.due_date ?? ""}
                    onChange={e =>
                      updateLocal(task.id, {
                        due_date: e.target.value
                      })
                    }
                  />
                </td>

                <td>
                  <button
                    onClick={() =>
                      handleDelete(task.id)
                    }
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded w-[400px] space-y-3">

            <input
              placeholder="Task title"
              value={title}
              onChange={e =>
                setTitle(e.target.value)
              }
              className="w-full bg-gray-800 p-2 rounded"
            />

            <input
              type="date"
              value={dueDate}
              onChange={e =>
                setDueDate(e.target.value)
              }
              className="w-full bg-gray-800 p-2 rounded"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setShowCreate(false)
                }
              >
                Cancel
              </button>

              <button
                disabled={creating}
                onClick={handleCreate}
              >
                {creating
                  ? "Creating..."
                  : "Create"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}