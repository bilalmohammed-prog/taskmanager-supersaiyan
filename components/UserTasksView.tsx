"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import "./Cobox/Cobox.css"; // reuse styles if needed
import { useSession } from "next-auth/react";

type Task = {
  empID: string;
  id: string;
  task: string;
  description: string;
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

  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}




export default function UserTasksView() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const email = session?.user?.email;

  useEffect(() => {
    if (!email) return;

    async function load() {
      try {
        setLoading(true);

        // 1️⃣ Get employee by email
        const empRes = await fetch(`/api/get-emp?email=${email}`);
        const empData = await empRes.json();

        if (!empData?.empID) {
          setTasks([]);
          return;
        }

        // 2️⃣ Fetch tasks for that employee
        const taskRes = await fetch(`/api/displayTasks?empID=${empData.empID}`);
        const taskData = await taskRes.json();

        setTasks(taskData.tasks || []);
      } catch (e) {
        console.error("User task load error", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [email]);

  async function markCompleted(task: Task) {
    const proof = prompt("Enter proof of work");
    if (!proof) return alert("Proof is required");

    const submittedAt = new Date();

    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        proof,
        submittedAt
      })
    });

    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, status: "completed", proof, submittedAt }
          : t
      )
    );
  }

  function getStatusColor(t: Task) {
    if (t.status !== "completed") return "gray";

    const end = new Date(t.endTime);
    const submitted = new Date(t.submittedAt);

    return submitted <= end ? "limegreen" : "gold";
  }

  return (
  <div className="coboxContainer">
    <div className="cobox">
      {loading && (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
)}
      {!loading && tasks.length === 0 && (
        <p className="select-promptTaskLoading" style={{ textAlign: "center", marginTop: "20px" }}>
          You have no tasks.
        </p>
      )}
      {!loading &&
        tasks.map((t) => (
          <div
            key={t.id}
            className={`container3 ${selectedTask?.id === t.id ? "active-card" : ""}`}
            onClick={() => setSelectedTask(t)} // 1. Updates state on click
            style={{ cursor: "pointer" }}
          >
            <div className="taskText">
              {t.task}
              <br />
              {prettyDateTime(t.startTime)} → {prettyDateTime(t.endTime)}
            </div>

            <div className="container2">
              <button
                className="action-btn completed-button"
                onClick={(e) => {
                  e.stopPropagation(); // 2. Prevents selecting the card when clicking button
                  markCompleted(t);
                }}
                disabled={t.status === "completed"}
              >
                <Image src="/svg/completed.svg" alt="" width={32} height={32} />
              </button>
              <button
                className="checkbox"
                disabled
                style={{ background: getStatusColor(t) }}
              />
            </div>
          </div>
        ))}
    </div>

    {/* 3. MOVED OUTSIDE THE LOOP: The actual Detail View */}
    <div className="taskDescription">
      {selectedTask ? (
        <div className="description-content">
          <h2>{selectedTask.task}</h2>
          <hr />
          <p><strong>Status:</strong> {selectedTask.status}</p>
          <p><strong>Start:</strong> {prettyDateTime(selectedTask.startTime)}</p>
          <p><strong>Deadline:</strong> {prettyDateTime(selectedTask.endTime)}</p>
          {selectedTask.proof && (
            <div className="proof-box">
              <strong>Proof:</strong>
              <p>{selectedTask.proof}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="select-promptTaskDesc">Select a task to view details</p>
      )}
    </div>
  </div>
);
}