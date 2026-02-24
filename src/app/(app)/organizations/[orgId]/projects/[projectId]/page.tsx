"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { listTasksByProject } from "@/actions/task/listByProject";
import { updateTask } from "@/actions/task/update";
import { createTask } from "@/actions/task/create";
import { deleteTask as deleteTaskAction } from "@/actions/task/delete";
import type { Tables, Enums } from "@/lib/supabase/types";
import type { TablesUpdate } from "@/lib/supabase/types";
import { listHumanResources } from "@/actions/resource/listHumans";
import { assignTaskToResource } from "@/actions/task/assign";

type TaskWithAssignee = Tables<"tasks"> & {
  assignee_name: string | null;
};
type Task = Tables<"tasks">;
type TaskStatus = Enums<"task_status">;
type HumanResource = {
  id: string;
  name: string;
};

export default function ProjectWorkspacePage() {
    const [employees, setEmployees] =
      useState<HumanResource[]>([]);
    
    const [selectedEmployee, setSelectedEmployee] =
      useState<string>("");
  const { orgId, projectId } = useParams<{
    orgId: string;
    projectId: string;
  }>();
const [assigningTaskId, setAssigningTaskId] =
  useState<string | null>(null);
  const [tasks, setTasks] =
  useState<TaskWithAssignee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  // ---------- LOAD ----------
  useEffect(() => {
    async function load() {
        const humans = await listHumanResources(orgId);
setEmployees(humans);
      setLoading(true);
      const data = await listTasksByProject(
        projectId,
        orgId
      );
      setTasks(data as TaskWithAssignee[]);
      setLoading(false);
    }

    if (projectId && orgId) load();
  }, [projectId, orgId]);

  // ---------- UPDATE ----------
 

function updateLocal(
  id: string,
  updates: TablesUpdate<"tasks">
) {
  setTasks(prev =>
    prev.map(t =>
      t.id === id ? { ...t, ...updates } : t
    )
  );
}
async function commitUpdate(
  id: string,
  updates: TablesUpdate<"tasks">
) {
  try {
    await updateTask(id, updates, orgId);
  } catch (e) {
    console.error("Save failed", e);
  }
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

      const newTask: TaskWithAssignee = {
  ...created,
  assignee_name: null
};
if (selectedEmployee) {
  await assignTaskToResource(
    created.id,
    selectedEmployee
  );

  newTask.assignee_name =
    employees.find(
      e => e.id === selectedEmployee
    )?.name ?? null;
}
setTasks(prev => [newTask, ...prev]);;

      setTitle("");
      setDueDate("");
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
    setSelectedEmployee("");
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
                <th>Assigned</th>
              <th className="text-left p-2">Title</th>
              <th>Status</th>
              <th>Due</th>
              
              <th></th>
            </tr>
          </thead>

          <tbody>
            
            {tasks.map(task => (
              <tr key={task.id}>
                <td className="text-sm text-gray-400">
  {task.assignee_name ?? "—"}
</td>
                <td>
                  <input
                    value={task.title}
                    onChange={e =>
  updateLocal(task.id, {
    title: e.target.value
  })
}
onBlur={e =>
  commitUpdate(task.id, {
    title: e.target.value
  })
}
                    className="bg-transparent"
                  />
                </td>

                <td>
                  <select
                    value={task.status ?? "todo"}
                    onChange={e => {
  const value =
    e.target.value as TaskStatus;

  updateLocal(task.id, { status: value });
  commitUpdate(task.id, { status: value });
}}
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
onBlur={e =>
  commitUpdate(task.id, {
    due_date: e.target.value
  })
}
                  />
                </td>

                <td className="space-x-2">
  <button
    onClick={() =>
      setAssigningTaskId(task.id)
    }
    className="text-blue-400"
  >
    Assign
  </button>

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
              <select
  value={selectedEmployee}
  onChange={e =>
    setSelectedEmployee(e.target.value)
  }
  className="w-full bg-gray-800 p-2 rounded"
>
  <option value="">Unassigned</option>

  {employees.map(emp => (
    <option key={emp.id} value={emp.id}>
      {emp.name}
    </option>
  ))}
</select>
            </div>

          </div>
        </div>
      )}
{assigningTaskId && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-gray-900 p-6 rounded w-[360px] space-y-4">

      <h2 className="text-lg font-semibold">
        Assign Employee
      </h2>

      <select
        value={selectedEmployee}
        onChange={e =>
          setSelectedEmployee(e.target.value)
        }
        className="w-full bg-gray-800 p-2 rounded"
      >
        <option value="">Select employee</option>

        {employees.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>

      <div className="flex justify-end gap-2">
        <button
          onClick={() =>
            setAssigningTaskId(null)
          }
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            if (!selectedEmployee) return;

            await assignTaskToResource(
              assigningTaskId,
              selectedEmployee
            );

            setTasks(prev =>
              prev.map(t =>
                t.id === assigningTaskId
                  ? {
                      ...t,
                      assignee_name:
                        employees.find(
                          e =>
                            e.id ===
                            selectedEmployee
                        )?.name ?? null
                    }
                  : t
              )
            );

            setAssigningTaskId(null);
            setSelectedEmployee("");
          }}
        >
          Assign
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}