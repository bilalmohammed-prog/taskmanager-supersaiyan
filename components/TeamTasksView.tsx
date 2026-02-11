"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import "./Cobox.css";
import { useDashboard } from "./Context/DashboardContext";
import { supabase } from "@/lib/supabaseClient";

type Task = {
  emp_id: string;
  user_id: string;
  id: string;
  task: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  proof: string;
  
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

function safeISO(dt: string | Date) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


export default function TeamTasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [backupTask, setBackupTask] = useState<Record<string, Task>>({});

  const {
    selectedEmp,
    openAssignModal,
    setOpenAssignModal
  } = useDashboard();

  const emp_id = selectedEmp?.emp_id;
  const user_id = selectedEmp?.user_id;

  // New task state including description
  const [newTask, setNewTask] = useState({
    task: "",
    description: "",
    startTime: "",
    endTime: ""
  });

  // HELPER: Updates a task field in the local state array
  function updateTaskInState(taskId: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updates } : t)));
  }

  useEffect(() => {
    if (!emp_id) {
      setTasks([]);
      setLoading(false);
      return;
    }
    async function loadTasks() {

  setLoading(true);
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("No session");
      setTasks([]);
      return;
    }

      
    const res = await fetch(`/api/displayTasks?user_id=${user_id}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    setTasks(
  Array.isArray(data.tasks)
    ? data.tasks.map((t: Task) => ({
        emp_id: t.emp_id,
        user_id: t.user_id,
        id: t.id,
        task: t.task,
        description: t.description,
        startTime: t.startTime,
        endTime: t.endTime,
        status: t.status,
        proof: t.proof
      }))
    : []
);

  } catch (err) {
    console.error("Task load error", err);
  } finally {
    setLoading(false);
  }
}

    loadTasks();
  }, [user_id]);


  async function createTask() {
  if (!emp_id) return alert("No employee selected");
  
  // 1. Extract description from state
  const { task, description, startTime, endTime } = newTask;
    

  // 2. Added description.trim() to validation
  if (!task.trim() || !description.trim() || !startTime || !endTime) {
    return alert("Please enter title, description, start time and end time");
  }

  const id = crypto.randomUUID();
  
  // 3. Ensure description is in the JSON body
  const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  console.log("No user yet");
  return;
}

const { data: { session } } = await supabase.auth.getSession();


if (!session) {
  alert("Not logged in");
  return;
}

const res = await fetch(`/api/tasks`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },

    body: JSON.stringify({
      emp_id,

      id, 
      task,
      user_id:user_id,
      description, // <--- This sends it to your database
      startTime, 
      endTime,
      status: "pending", 
      proof: ""
    })
    
  });
console.log(user_id);
  const data = await res.json();
  if (!res.ok) return alert(data.error || "Failed to create task");

  const normalizedTask: Task = {
  emp_id: data.task.emp_id,
  user_id: data.task.user_id,
  id: data.task.id,
  task: data.task.task,
  description: data.task.description,
  startTime: data.task.start_time,
  endTime: data.task.end_time,
  status: data.task.status,
  proof: data.task.proof
};

setTasks(prev => [...prev, normalizedTask]);

  setOpenAssignModal(false);
  
  // 4. Reset the state including description
  setNewTask({ task: "", description: "", startTime: "", endTime: "" });
}

  async function saveTask(taskId: string) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  // FIX: Fallback to empty string so .trim() doesn't crash on old tasks
  const currentTask = t.task || "";
  const currentDesc = t.description || ""; 

  // --- VALIDATION ---
  if (!currentTask.trim() || !currentDesc.trim() || !t.startTime || !t.endTime) {
    alert("All fields (Title, Description, Start, and End time) are required.");
    return;
  }

  try {
    const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  alert("Not logged in");
  return;
}

const res = await fetch(`/api/tasks/${taskId}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },

      body: JSON.stringify({
        emp_id: selectedEmp?.emp_id,
        id: taskId,
        task: currentTask.trim(),
        description: currentDesc.trim(),
        startTime: t.startTime,
        endTime: t.endTime,
        proof: "not provided"
      })
    });

    // IMPROVEMENT: See the actual error from the server if it fails
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to save");
    }

    updateTaskInState(taskId, { isEditing: false });
    
    // Update the selected view to show the new description immediately
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...t, description: currentDesc, isEditing: false });
    }

  } catch (err: unknown) {
    // 1. Determine the error message safely
    const errorMessage = err instanceof Error 
      ? err.message 
      : "An unexpected error occurred. Please try again.";

    // 2. Alert the user using the safe string
    alert(errorMessage);
    
    // 3. Log the full error for debugging
    console.error("Save error:", err);
  }
}

  async function deleteTask(taskId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    alert("Not logged in");
    return;
  }

  setTasks(prev => prev.filter(t => t.id !== taskId));
  if (selectedTask?.id === taskId) setSelectedTask(null);

  await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}


  if(selectedEmp){
  return (
    <div className="coboxContainer">
      <div className="cobox">
        {/* ASSIGN MODAL */}
        {openAssignModal && (
          <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && setOpenAssignModal(false)}>
            <div className="modalBox">
              <h3>Assign Task</h3>
              <input placeholder="Task Title" value={newTask.task} onChange={e => setNewTask(p => ({ ...p, task: e.target.value }))} />
              
              <input type="datetime-local" value={newTask.startTime} onChange={e => setNewTask(p => ({ ...p, startTime: e.target.value }))} />
              <input type="datetime-local" value={newTask.endTime} onChange={e => setNewTask(p => ({ ...p, endTime: e.target.value }))} />
              {/* INSERT THIS BETWEEN Task Title and Start Time inputs */}
<textarea 
  placeholder="Enter Detailed Description" 
  value={newTask.description} 
  onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} 
  style={{
    width: "95%",
    minHeight: "100px",
    padding: "8px",
    marginTop: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    background: "transparent",
    color: "inherit",
    display: "block",
    resize:"vertical"
  }}
/>
              <div className="row">
                <button onClick={() => setOpenAssignModal(false)}>Cancel</button>
                <button onClick={createTask}>Create</button>
              </div>
            </div>
          </div>
        )}


        {loading && (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
)}


        {!loading && tasks.length === 0 && (
  <p className="select-promptTaskLoading" style={{ textAlign: "center", marginTop: "20px" }}>
    This employee has no tasks.
  </p>
)}

        {!loading && tasks.map(t => (
          <div
            key={t.id}
            className={`container3 ${t.isEditing ? "editing" : ""} ${selectedTask?.id === t.id ? "active-card" : ""}`}
            onClick={() => !t.isEditing && setSelectedTask(t)}
          >
            <div className="taskText">
              {!t.isEditing ? (
                <>
                  <p>{t.task}</p> <br />
                  <p>{prettyDateTime(t.startTime)} → {prettyDateTime(t.endTime)}</p>
                </>
              ) : (
                <div className="edit-fields" onClick={(e) => e.stopPropagation()}>
                  <input className="edit-input" value={t.task} onChange={e => updateTaskInState(t.id, { task: e.target.value })} />
                  <textarea className="edit-input" value={t.description || ""} placeholder="Description..." onChange={e => updateTaskInState(t.id, { description: e.target.value })} />
                  <input type="datetime-local" className="edit-input" value={safeISO(t.startTime)} onChange={e => updateTaskInState(t.id, { startTime: e.target.value })} />
                  <input type="datetime-local" className="edit-input" value={safeISO(t.endTime)} onChange={e => updateTaskInState(t.id, { endTime: e.target.value })} />
                </div>
              )}
            </div>

            <div className="container2">
              {!t.isEditing ? (
                <>
                  <button className="action-btn update-button" onClick={(e) => {
                    e.stopPropagation();
                    setBackupTask(b => ({ ...b, [t.id]: { ...t } }));
                    updateTaskInState(t.id, { isEditing: true });
                  }}>
                    <Image src="/svg/updateTask.svg" alt="update" width={32} height={32} />
                  </button>
                  <button className="action-btn delete-button" onClick={(e) => { e.stopPropagation(); deleteTask(t.id); }}>
                    <Image src="/svg/deleteTask.svg" alt="delete" width={32} height={32} />
                  </button>
                </>
              ) : (
                <>
                  <button className="action-btn update-button" onClick={(e) => { e.stopPropagation(); saveTask(t.id); }}>
                    <Image src="/svg/updateTask.svg" alt="save" width={32} height={32} />
                  </button>
                  <button className="action-btn delete-button" onClick={(e) => {
                    e.stopPropagation();
                    const original = backupTask[t.id];
                    updateTaskInState(t.id, { ...original, isEditing: false });
                  }}>
                    <Image src="/svg/deleteTask.svg" alt="cancel" width={32} height={32} />
                  </button>
                </>
              )}
              <button className="checkbox" disabled />
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL VIEW */}
      <div className="taskDescription">
        {selectedTask ? (
          <div className="description-content">
            <h2>{selectedTask.task}</h2>
            <hr />
            <div style={{ marginTop: '15px' }}>
              <strong>Description:</strong>
              <p style={{ opacity: 0.9, marginTop: '5px', whiteSpace: 'pre-wrap' }}>
                {selectedTask.description || "No description provided."}
              </p>
            </div>
            <p style={{ marginTop: '15px' }}><strong>Status:</strong> {selectedTask.status}</p>
            <p><strong>Start:</strong> {prettyDateTime(selectedTask.startTime)}</p>
            <p><strong>Deadline:</strong> {prettyDateTime(selectedTask.endTime)}</p>
            
            {selectedTask.proof && (
              <div className="proof-box">
                <strong>Proof of Work:</strong>
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
}else{
  return(<p className="select-an-employee">Select or add an employee to manage tasks</p>);
}
}