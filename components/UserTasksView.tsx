"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import "./Cobox/Cobox.css";
import { supabase } from "@/lib/supabaseClient";

type Task = {
  id: string;
  user_id: string | null;
  task: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: string;
  proof: string | null;
  

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
    hour12: true,
  });
}

export default function UserTasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    async function loadTasks(): Promise<void> {
      setLoading(true);

      // 1️⃣ Ensure user is authenticated (client-safe)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // 2️⃣ RLS-enforced task fetch (NO filters)
      const { data, error } = await supabase
        .from("tasks")
.select(`
  id,
  task,
  user_id,
  description,
  start_time,
  end_time,
  status,
  proof
`)
.eq("user_id", session.user.id)
.order("start_time", { ascending: true });


      if (error) {
        console.error("Task load error:", error.message);
        setTasks([]);
      } else {
        setTasks(
          data.map((t) => ({
            id: t.id,
            user_id: t.user_id,
            task: t.task,
            description: t.description,
            startTime: t.start_time,
            endTime: t.end_time,
            status: t.status,
            proof: t.proof,

          }))
        );
      }

      setLoading(false);
    }

    loadTasks();
  }, []);

  async function markCompleted(task: Task): Promise<void> {
    const proof = prompt("Enter proof of work");
    if (!proof) return alert("Proof is required");

    const submittedAt = new Date().toISOString();

    const { error } = await supabase
      .from("tasks")
      .update({
        status: "completed",
        proof: proof,

      })
      .eq("id", task.id);

    if (error) {
      alert("Failed to mark task completed");
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: "completed", proof, submittedAt }
          : t
      )
    );
  }

  function getStatusColor(t: Task){
    if (t.status !== "completed") return "gray";





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
          <p className="select-promptTaskLoading">
            You have no tasks.
          </p>
        )}

        {!loading &&
          tasks.map((t) => (
            <div
              key={t.id}
              className={`container3 ${
                selectedTask?.id === t.id ? "active-card" : ""
              }`}
              onClick={() => setSelectedTask(t)}
              style={{ cursor: "pointer" }}
            >
              <div className="taskText">
                {t.task}
                <br />
                {prettyDateTime(t.startTime)} →{" "}
                {prettyDateTime(t.endTime)}
              </div>

              <div className="container2">
                <button
                  className="action-btn completed-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markCompleted(t);
                  }}
                  disabled={t.status === "completed"}
                >
                  <Image
                    src="/svg/completed.svg"
                    alt=""
                    width={32}
                    height={32}
                  />
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

      <div className="taskDescription">
        {selectedTask ? (
          <div className="description-content">
            <h2>{selectedTask.task}</h2>
            <hr />
            <p>
              <strong>Status:</strong> {selectedTask.status}
            </p>
            <p>
              <strong>Start:</strong>{" "}
              {prettyDateTime(selectedTask.startTime)}
            </p>
            <p>
              <strong>Deadline:</strong>{" "}
              {prettyDateTime(selectedTask.endTime)}
            </p>

            {selectedTask.proof && (
              <div className="proof-box">
                <strong>Proof:</strong>
                <p>{selectedTask.proof}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="select-promptTaskDesc">
            Select a task to view details
          </p>
        )}
      </div>
    </div>
  );
}
