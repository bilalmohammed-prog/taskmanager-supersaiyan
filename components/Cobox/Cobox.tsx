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


  return (
    <div className="cobox">
      {!selectedEmp && <p>Select an employee</p>}

      {loading && <p>Loading...</p>}

      {!loading && tasks.length === 0 && <p>No tasks found</p>}

      {!loading &&
        tasks.map(t => (
          <div key={t.id} className="container3">
            <div className="taskText">
              {t.task} <br />
              {prettyDateTime(t.startTime)} → {prettyDateTime(t.endTime)}
            </div>

            <div className="container2">
              <button className="action-btn delete-button"
                onClick={()=>deleteTask(t.id)}
              >
                <Image src="/svg/deleteTask.svg" alt="Draft icon" width={32} height={32}/>
              </button>
              <button className="action-btn update-button"
                onClick={()=>updateTask(t.id)}
              >
                <Image src="/svg/updateTask.svg" alt="Draft icon" width={32} height={32}/>
              </button>
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
