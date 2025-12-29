"use client";

import "./Cobox.css";
import { useState,useEffect } from "react";



type Section = "tasks" | "inbox" | "progress" | "teamTasks";

type Props = { section: Section };

type Task = {
  empID: string,
  id: string,
  task: string,
  startTime: string // now full datetime string
  endTime: string   // now full datetime string
  status: string,
  proof: string,
  durationHours: number, // optional computed field
  submittedAt: Date
};

export default function Cobox({ section }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  

  useEffect(() => {
    async function loadTasks() {
    setLoading(true);
    try {
      const empID = "EMP-2025-000020";
      const res = await fetch(`/api/displayTasks?empID=${empID}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Task load error", err);
    }
    setLoading(false);
  }
    if (section === "tasks" || section === "teamTasks") loadTasks();
  }, [section]);

  // ---------------- UI SWITCH ----------------
  if (section === "progress") return <ProgressView />;
  if (section === "inbox") return <InboxView />;
  console.log("COBOX TASKS:", tasks);

  return (
    <div className="cobox">
        
      {loading && <p>Loading...</p>}

      {!loading && tasks.length === 0 && <p>No tasks found</p>}

      {!loading &&
  tasks.map(t => (
    <div key={t.id} className="taskCard">
      <div><strong>{t.task}</strong></div>

      <div>
        {t.startTime} → {t.endTime}
      </div>

      <div>Status: {t.status}</div>
    </div>
  ))
}

        
    </div>
    
  );
}

// ---------------- SUB COMPONENTS ----------------
function ProgressView() {
  return <div>Progress UI will render here</div>;
}

function InboxView() {
  return <div>Inbox UI will render here</div>;
}
