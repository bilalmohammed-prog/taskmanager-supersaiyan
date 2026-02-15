"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type TaskRow = {
  id: string;
  title: string;
  status: string | null;
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

  useEffect(() => {
    async function loadTasks() {
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
    <div className="p-6 text-white">
      <h1 className="text-xl mb-2">
  {profile?.full_name ?? "Employee"}
</h1>

      <h1 className="text-xl mb-4">Employee Tasks</h1>

      {loading && <p>Loading...</p>}

      {!loading && tasks.length === 0 && (
        <p>No tasks assigned</p>
      )}

      {!loading &&
  tasks.map(task => (
    <div
      key={task.id}
      className="p-4 bg-[#1e1e1e] rounded-xl mb-3 border border-white/5 hover:border-white/10 transition"
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-lg">
          {task.title}
        </h2>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(task.status)}`}
        >
          {task.status ?? "unknown"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
        <div>
          <p className="text-gray-500">Due</p>
          <p>{formatDate(task.due_date)}</p>
        </div>

        <div>
          <p className="text-gray-500">Allocated</p>
          <p>{task.allocated_hours ?? 0} hrs</p>
        </div>

        <div>
          <p className="text-gray-500">Start</p>
          <p>{formatDate(task.start_time)}</p>
        </div>

        <div>
          <p className="text-gray-500">End</p>
          <p>{formatDate(task.end_time)}</p>
        </div>
      </div>
    </div>
  ))}

    </div>
  );
}
