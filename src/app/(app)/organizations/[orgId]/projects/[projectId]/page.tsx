"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { listTasksByProject } from "@/actions/task/listByProject";
import { updateTask } from "@/actions/task/update";
import { createTask } from "@/actions/task/create";
import { deleteTask as deleteTaskAction } from "@/actions/task/delete";
import type { Tables, Enums } from "@/lib/supabase/types";
import type { TablesUpdate } from "@/lib/supabase/types";
import { listOrgMembers } from "@/actions/organization/listOrgMembers";
import { assignTaskToResource } from "@/actions/task/assign";
import { listProjectMembers } from "@/actions/project/listProjectMembers";
import { assignProjectMember } from "@/actions/project/assignProjectMember";
import { removeProjectMember } from "@/actions/project/removeProjectMember";


type TaskWithAssignee = Tables<"tasks"> & {
  assignee_id: string | null;
  assignee_name: string | null;
};
type Task = Tables<"tasks">;
type TaskStatus = Enums<"task_status">;
type HumanResource = {
  user_id: string;
  name: string;
};

export default function ProjectWorkspacePage() {
    const [projectMembers, setProjectMembers] =
  useState<HumanResource[]>([]);

const [showProjectAssign, setShowProjectAssign] =
  useState(false);
    const [savingId, setSavingId] =
  useState<string | null>(null);
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
  const [selectedProjectMember, setSelectedProjectMember] =
  useState<string>("");
  // ---------- LOAD ----------
  useEffect(() => {
    async function load() {
        const humans = await listOrgMembers(orgId);

setEmployees(
  humans.map(h => ({
    user_id: h.user_id,
    name: h.name
  }))
);
        const members =
  await listProjectMembers(projectId);

setProjectMembers(members);

      setLoading(true);
      const data = await listTasksByProject(
        projectId,
        orgId
      );
     setTasks(data);
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
    setSavingId(id);

    await updateTask(id, updates, orgId);
  } catch (e) {
    console.error("Save failed", e);
  } finally {
    setSavingId(null);
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
  assignee_id: null,
  assignee_name: null
};
if (selectedEmployee) {
  await assignTaskToResource(
    created.id,
    selectedEmployee
  );

  newTask.assignee_name =
    employees.find(
      e => e.user_id === selectedEmployee
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
  onClick={() => setShowProjectAssign(true)}
  className="px-4 py-2 bg-gray-700 rounded"
>
  + Assign Member to Project
</button>
      <button
        onClick={() => setShowCreate(true)}
        className="px-4 py-2 bg-blue-600 rounded"
      >
        + Add Task
      </button>
      <div className="flex gap-2 items-center">

  <select
    value={selectedProjectMember}
    onChange={e =>
      setSelectedProjectMember(e.target.value)
    }
    className="bg-gray-800 p-2 rounded"
  >
    <option value="">Select project member</option>

    {projectMembers.map(emp => (
      <option
        key={emp.user_id}
        value={emp.user_id}
      >
        {emp.name}
      </option>
    ))}
  </select>

  <button
    onClick={async () => {
      
      if (!selectedProjectMember) return;

      await removeProjectMember(
        projectId,
        selectedProjectMember
      );

      // instant UI update
      setProjectMembers(prev =>
        prev.filter(
          m =>
            m.user_id !== selectedProjectMember
        )
      );

      setSelectedProjectMember("");
    }}
    
    className="px-3 py-2 bg-red-600 rounded"
  >
    Remove Member
  </button>

</div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr><th>Assign</th>
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
                <td>
  <select
    value={task.assignee_id || ""}
    onChange={async e => {
  const resourceId = e.target.value;

  // unassign case
  

  await assignTaskToResource(
  task.id,
  resourceId || null
);

  const emp = projectMembers.find(
    m => m.user_id === resourceId
  );

  setTasks(prev =>
    prev.map(t =>
      t.id === task.id
        ? {
            ...t,
            assignee_id: resourceId,
            assignee_name: emp?.name ?? null
          }
        : t
    )
  );
}}
    className="bg-gray-800 p-1 rounded"
  >
    <option value="">Unassigned</option>

    {projectMembers.map(emp => (
      <option key={emp.user_id} value={emp.user_id}>
        {emp.name}
      </option>
    ))}
  </select>
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
  onKeyDown={e => {
    if (e.key === "Enter") {
      e.currentTarget.blur(); // triggers onBlur save
    }
  }}
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
onKeyDown={e => {
  if (e.key === "Enter") {
    e.currentTarget.blur();
  }

  if (e.key === "Escape") {
    e.currentTarget.blur();
  }
}}
                  />
                </td>

                <td className="flex items-center gap-2">
  {savingId === task.id && (
    <span className="text-xs text-gray-400">
      Saving…
    </span>
  )}

  <button
    onClick={() => handleDelete(task.id)}
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

  {projectMembers.map(emp => (
  <option key={emp.user_id} value={emp.user_id}>
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
          <option key={emp.user_id} value={emp.user_id}>
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
          assignee_id: selectedEmployee,   // ⭐ ADD THIS
          assignee_name:
            employees.find(
              e => e.user_id === selectedEmployee
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
{showProjectAssign && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-gray-900 p-6 rounded w-[400px] space-y-4">

      <h2 className="text-lg font-semibold">
        Assign Project Member
      </h2>

      <select
        value={selectedEmployee}
        onChange={e =>
          setSelectedEmployee(e.target.value)
        }
        className="w-full bg-gray-800 p-2 rounded"
      >
        <option value="">Select employee</option>

        {employees
  .filter(
    e =>
      !projectMembers.some(
        m => m.user_id === e.user_id
      )
  )
  .map(emp => (
    <option
      key={emp.user_id}
      value={emp.user_id}
    >
      {emp.name}
    </option>
))}
      </select>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowProjectAssign(false)}
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            if (!selectedEmployee) return;

            await assignProjectMember(
              projectId,
              selectedEmployee,
              orgId
            );

            const emp = employees.find(
              e => e.user_id === selectedEmployee
            );

            if (emp) {
              setProjectMembers(prev => [
                ...prev,
                emp
              ]);
            }

            setSelectedEmployee("");
            setShowProjectAssign(false);
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
