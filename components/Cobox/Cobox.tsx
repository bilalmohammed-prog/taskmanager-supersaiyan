"use client";

import "./Cobox.css";
import { useState, useEffect } from "react";
import Image from "next/image";

type Section = "tasks" | "inbox" | "progress" | "teamTasks";

type Task = {
  empID: string;
  id: string;
  task: string;
  startTime: string;
  endTime: string;
  status: string;
  proof: string;
  durationHours: number;
  submittedAt: Date;
  isEditing?: boolean;
};

function prettyDateTime(dt: string | Date | number) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return String(dt);

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function safeISO(dt: string | Date) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}




type Props = {
  section: Section;
  selectedEmp: { empID: string; name: string } | null;
};

export default function Cobox({ section, selectedEmp }: Props) {
  if (section === "tasks") return <UserTasksView />;

  if (section === "teamTasks")
    return <TeamTasksView selectedEmp={selectedEmp} />;

  if (section === "progress") return <ProgressView />;

  if (section === "inbox") return <InboxView />;

  return null;
}

/* ---------------- TEAM TASKS ---------------- */

type SelectedEmp =
  | {
      empID: string;
      name: string;
    }
  | null;

function TeamTasksView({ selectedEmp }: { selectedEmp: SelectedEmp }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const empID = selectedEmp?.empID;
  const [backupTask, setBackupTask] = useState<Record<string, Task>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    task: "",
    startTime: "",
    endTime: ""
  });

  useEffect(() => {
  

  
  if (!empID) {
    setTasks([]);
    setLoading(false);
    return;
  }

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch(`/api/displayTasks?empID=${empID}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Task load error", err);
    } finally {
      setLoading(false);
    }
  }

  loadTasks();
}, [empID]);   // <-- THIS is what links it to employee change

async function deleteTask(taskId: string){
  setTasks(prev => prev.filter(t => t.id !== taskId));
  await fetch(`/api/tasks/${taskId}`, {
  method: "DELETE"
});
}

// ----- INLINE EDIT SAVE -----
  async function saveEdit(taskId: string) {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              task: editValues.task,
              startTime: editValues.startTime,
              endTime: editValues.endTime
            }
          : t
      )
    );

    setEditingId(null);

    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: editValues.task,
        startTime: editValues.startTime,
        endTime: editValues.endTime
      })
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

async function updateTask(taskId: string){

setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, status: "completed" } : t
      )
    );

  await fetch(`/api/tasks/${taskId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "completed" })
});

}

async function saveTask(taskId: string) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const { task: name, startTime, endTime } = task;

  // 1️⃣ all fields must exist
  if (!name.trim() || !startTime || !endTime) {
    alert("Please enter task, start time and end time");
    return;
  }

  // 2️⃣ times must be valid dates
  const s = new Date(startTime);
  const e = new Date(endTime);

  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    alert("Please enter valid date & time values");
    return;
  }

  // 3️⃣ optional: end must be after start
  if (e < s) {
    alert("End time cannot be earlier than start time");
    return;
  }

  // If valid → continue saving
  await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: name,
      startTime,
      endTime
    })
  });

  setTasks(prev =>
    prev.map(t =>
      t.id === taskId ? { ...t, isEditing: false } : t
    )
  );
}




  return (
  <div className="cobox">
    {!selectedEmp && <p>Select an employee</p>}

    {loading && <p>Loading...</p>}

    {!loading && tasks.length === 0 && <p>No tasks found</p>}

    {!loading &&
      tasks.map(t => (
        <div
          key={t.id}
          className={`container3 ${t.isEditing ? "editing" : ""}`}
        >
          <div className="taskText">
            {!t.isEditing ? (
              <>
                {t.task} <br />
                {prettyDateTime(t.startTime)} → {prettyDateTime(t.endTime)}
              </>
            ) : (
              <>
                <input
                  className="edit-input" required
                  value={t.task}
                  onChange={e =>
                    setTasks(prev =>
                      prev.map(x =>
                        x.id === t.id ? { ...x, task: e.target.value } : x
                      )
                    )
                  }
                  onKeyDown={(e) => {
  if (e.key === "Enter") saveTask(t.id);
}}

                />

                <input
                  type="datetime-local" required
                  className="edit-start"
                  value={safeISO(t.startTime)}

                  onChange={e =>
                    setTasks(prev =>
                      prev.map(x =>
                        x.id === t.id
                          ? { ...x, startTime: e.target.value }
                          : x
                      )
                    )
                  }
                  onKeyDown={(e) => {
  if (e.key === "Enter") saveTask(t.id);
}}

                />

                <input
                  type="datetime-local" required
                  className="edit-end"
                  value={safeISO(t.endTime)}

                  onChange={e =>
                    setTasks(prev =>
                      prev.map(x =>
                        x.id === t.id
                          ? { ...x, endTime: e.target.value }
                          : x
                      )
                    )
                  }
                  onKeyDown={(e) => {
  if (e.key === "Enter") saveTask(t.id);
}}

                />
              </>
            )}
          </div>

          <div className="container2">
            {!t.isEditing ? (
              <>
                

                <button
                  className="action-btn update-button"
                  onClick={() =>
  setTasks(prev =>
    prev.map(x => {
      if (x.id === t.id) {
        setBackupTask(b => ({ ...b, [t.id]: { ...x } })); // store per task
        return { ...x, isEditing: true };
      }
      return x;
    })
  )
}


                >
                  <Image
                    src="/svg/updateTask.svg"
                    alt="update"
                    width={32}
                    height={32}
                  />
                </button>
                <button
                  className="action-btn delete-button"
                  onClick={() => deleteTask(t.id)}
                >
                  <Image
                    src="/svg/deleteTask.svg"
                    alt="delete"
                    width={32}
                    height={32}
                  />
                </button>
              </>
            ) : (
              <>
                <button
                  className="action-btn update-button"
                  onClick={() => saveTask(t.id)}
                >
                  <Image
                    src="/svg/updateTask.svg"
                    alt="update"
                    width={32}
                    height={32}
                  />
                </button>

                <button
                  className="action-btn delete-button"
                  onClick={() =>
  setTasks(prev =>
    prev.map(x =>
      x.id === t.id
        ? { ...backupTask[t.id], isEditing: false }
        : x
    )
  )
}


                >
                  <Image
                    src="/svg/deleteTask.svg"
                    alt="delete"
                    width={32}
                    height={32}
                  />
                </button>
              </>
            )}

            <button className="checkbox" disabled />
          </div>
        </div>
      ))}
  </div>
);

}

/* ---------------- OTHER VIEWS ---------------- */

function UserTasksView() {
  return <div className="cobox">Your personal tasks UI</div>;
}

function InboxView() {
  return <div className="cobox">Inbox UI here</div>;
}

function ProgressView() {
  return <div className="cobox">Progress UI here</div>;
}
