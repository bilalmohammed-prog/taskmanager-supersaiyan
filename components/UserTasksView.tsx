"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "./Cobox/Cobox.css";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";



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
function randomEmpId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "EMP-";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
async function generateUniqueEmpId(supabase: SupabaseClient) {

  let unique = false;
  let newId = "";

  while (!unique) {
    newId = randomEmpId();

    const { data } = await supabase
      .from("empid")
      .select("emp_id")
      .eq("emp_id", newId)
      .maybeSingle();

    if (!data) unique = true;
  }

  return newId;
}


async function ensureEmployeeProfile(
  user: { id: string; email?: string; user_metadata?: { full_name?: string } },
  supabase: SupabaseClient
) {
  const { data: existingEmp } = await supabase
    .from("empid")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingEmp) return true;

  const { error } = await supabase.from("empid").upsert(
    {
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || "Unknown",
      emp_id: await generateUniqueEmpId(supabase),
    },
    { onConflict: "user_id" }
  );

  if (error && error.code !== "23505") {
    console.error(error);
    return false;
  }

  // 🔑 Critical step
  await supabase.auth.refreshSession();

  const { data } = await supabase
    .from("empid")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data;
}



export default function UserTasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const initRef = useRef(false);


  useEffect(() => {
    let mounted = true;

    async function loadTasks() {
      try {
        // Prevent concurrent initialization
        if (initRef.current) return;
initRef.current = true;


        setLoading(true);
        setInitializationError(null);
   

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) {
            setLoading(false);
            initRef.current = false;


          }
          return;
        }

        const user = session.user;

        // Ensure employee profile exists and is ready
        const profileReady = await ensureEmployeeProfile(user, supabase);
        
        if (!profileReady) {
          if (mounted) {
            setInitializationError("Failed to initialize employee profile. Please refresh the page.");
            setLoading(false);
            initRef.current = false;


          }
          return;
        }

        // Fetch Tasks
        const { data, error } = await supabase
          .from("tasks")
          .select(`id, task, user_id, description, start_time, end_time, status, proof`)
          .eq("user_id", user.id)
          .order("start_time", { ascending: true });

        if (mounted) {
          if (!error && data) {
            setTasks(data.map(t => ({
              id: t.id,
              user_id: t.user_id,
              task: t.task,
              description: t.description,
              startTime: t.start_time,
              endTime: t.end_time,
              status: t.status,
              proof: t.proof,
            })));
          }
          setLoading(false);
          initRef.current = false;


        }
      } catch (err) {
        console.error("Error in loadTasks:", err);
        if (mounted) {
          setInitializationError("An error occurred while loading tasks.");
          setLoading(false);
          initRef.current = false;


        }
      }
    }

    loadTasks();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && mounted) {
        console.log("🔐 SIGNED_IN event detected");
        loadTasks();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Keep dependencies empty


  

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

  function getStatusColor(t: Task) {
  if (t.status === "completed") return "green";
  return "gray";
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
          {initializationError && !loading && (
  <div className="error-container" style={{ 
    color: 'red', 
    padding: '20px', 
    textAlign: 'center',
    background: '#fee',
    borderRadius: '8px',
    margin: '20px'
  }}>
    <p>{initializationError}</p>
    <button 
      onClick={() => window.location.reload()} 
      style={{ 
        marginTop: '10px',
        padding: '8px 16px',
        cursor: 'pointer'
      }}
    >
      Retry
    </button>
  </div>
)}
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
