"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import "./Cobox.css";
import { supabase } from "@/lib/supabase/client";

import type { Tables } from "@/lib/supabase/types";

type TaskRow = Tables<"tasks">;


type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string | null;
};



function prettyDateTime(dt: string | Date | number | null) {
  if (!dt) return "-";
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

  const initRef = useRef(false);


  useEffect(() => {
    let mounted = true;

    async function loadTasks() {
      try {
        // Prevent concurrent initialization
        if (initRef.current) return;
initRef.current = true;


        setLoading(true);

   

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) {
            setLoading(false);
            initRef.current = false;


          }
          return;
        }

        const user = session.user;

        

        // Fetch Tasks
        const { data, error } = await supabase
  .from("tasks")
  .select("id, title, description, due_date, status")
  .order("created_at", { ascending: true });


        if (mounted) {
         if (!error && data) {
  const rows = data as TaskRow[];

  setTasks(data.map(t => ({
  id: t.id,
  title: t.title,
  description: t.description,
  due_date: t.due_date,
  status: t.status,
})));

}

          setLoading(false);
          initRef.current = false;


        }
      } catch (err) {
        console.error("Error in loadTasks:", err);
        if (mounted) {

          setLoading(false);
          initRef.current = false;


        }
      }
    }

    loadTasks();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && mounted) {
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

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "done",
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
        ? { ...t, status: "done", proof }
        : t
    )
  );
  setSelectedTask(prev =>
  prev && prev.id === task.id
    ? { ...prev, status: "done", proof }
    : prev
);

}

  function getStatusColor(t: Task) {
  if (t.status === "done") return "green";
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
                {t.title}
                <br />
                {prettyDateTime(t.due_date)}
              </div>

              <div className="container2">
                <button
                  className="action-btn completed-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markCompleted(t);
                  }}
                  disabled={t.status === "done"}

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
            <h2>{selectedTask.title}</h2>
            <hr />
            <p>
              <strong>Status:</strong> {selectedTask.status}
            </p>
            
            <p>
              <strong>Deadline:</strong>{" "}
              {prettyDateTime(selectedTask.due_date)}
            </p>

            
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
