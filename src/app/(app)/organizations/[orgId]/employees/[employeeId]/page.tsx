"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { updateTask } from "@/actions/task/update";
import type { TablesUpdate } from "@/lib/supabase/types";


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

type TaskStatus = "todo" | "in_progress" | "blocked" | "done";


function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

function statusColor(status?: string | null) {
  switch (status) {
    case "done":
      return "bg-green-500/20 text-green-400";
    case "in_progress":
      return "bg-yellow-500/20 text-yellow-400";
    case "todo":
      return "bg-gray-500/20 text-gray-300";
    default:
      return "bg-gray-700 text-gray-400";
  }
}




export default function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
const [orgId, setOrgId] = useState<string | null>(null);


  function updateTitle(id: string, value: string) {
  setTasks(prev =>
    prev.map(t => (t.id === id ? { ...t, title: value } : t))
  );
}

function updateStatus(id: string, value: TaskStatus) // ✔
 {
  setTasks(prev =>
    prev.map(t => (t.id === id ? { ...t, status: value } : t))
  );
}
async function saveTask(
  id: string,
  updates: TablesUpdate<"tasks">
) {
  if (!orgId) {
    alert("No organization selected");
    return;
  }

  try {
    await updateTask(id, updates, orgId);
  } catch (e) {
    console.error(e);
    alert("Save failed");
  }
}



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


  useEffect(() => {
    
    async function loadTasks() {
      const { data: org } = await supabase
  .from("organizations")
  .select("id")
  .single();

setOrgId(org?.id ?? null);

      setLoading(true);
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
          value={task.title}
          onChange={e => updateTitle(task.id, e.target.value)}
          onBlur={e =>
            saveTask(task.id, { title: e.target.value })
          }
          onKeyDown={e => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="bg-transparent border-b border-white/20"
        />
      </td>

      <td>
        <select
  value={task.status ?? ""}
  onChange={async e => {
    const value = e.target.value as TaskStatus;

    updateStatus(task.id, value);
    await saveTask(task.id, { status: value });
  }}
>
  <option value="todo">Todo</option>
  <option value="in_progress">In Progress</option>
  <option value="blocked">Blocked</option>
  <option value="done">Done</option>
</select>

      </td>

      <td>{formatDate(task.due_date)}</td>
      <td>{task.allocated_hours ?? 0}</td>

      <td className="flex gap-2">
        <button onClick={() => deleteTask(task.id)}>🗑</button>
      </td>
    </tr>
  ))}
</tbody>

  </table>
</div>

  );
}
