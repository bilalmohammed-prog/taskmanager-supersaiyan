"use client";

import "./Cobox.css";
import { useState, useEffect } from "react";
import Image from "next/image";

import { useSession } from "next-auth/react";

type Section = "tasks" | "inbox" | "progress" | "teamTasks";

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


function UserTasksView() {
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
      {loading && <p>Loading...</p>}

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
        <p className="select-prompt">Select a task from the list to view details.</p>
      )}
    </div>
  </div>
);
}





type Props = {
  section: Section;
  selectedEmp: { empID: string; name: string } | null;

  openAssignModal: boolean;
  setOpenAssignModal: React.Dispatch<React.SetStateAction<boolean>>;
};


export default function Cobox({ section, selectedEmp, openAssignModal, setOpenAssignModal }: Props) {
  if (section === "tasks") return <UserTasksView />;

  if (section === "teamTasks")
  return (
    <TeamTasksView
      selectedEmp={selectedEmp}
      openAssignModal={openAssignModal}
      setOpenAssignModal={setOpenAssignModal}
    />
  );


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

function TeamTasksView({
  selectedEmp,
  openAssignModal,
  setOpenAssignModal
}: {
  selectedEmp: SelectedEmp;
  openAssignModal: boolean;
  setOpenAssignModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [backupTask, setBackupTask] = useState<Record<string, Task>>({});

  const empID = selectedEmp?.empID;

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
  }, [empID]);

  async function createTask() {
  if (!empID) return alert("No employee selected");
  
  // 1. Extract description from state
  const { task, description, startTime, endTime } = newTask;

  // 2. Added description.trim() to validation
  if (!task.trim() || !description.trim() || !startTime || !endTime) {
    return alert("Please enter title, description, start time and end time");
  }

  const id = crypto.randomUUID();
  
  // 3. Ensure description is in the JSON body
  const res = await fetch(`/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      empID, 
      id, 
      task, 
      description, // <--- This sends it to your database
      startTime, 
      endTime,
      status: "pending", 
      proof: ""
    })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "Failed to create task");

  setTasks(prev => [...prev, data.task]);
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
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: currentTask.trim(),
        description: currentDesc.trim(),
        startTime: t.startTime,
        endTime: t.endTime
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
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }

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
    width: "100%",
    minHeight: "100px",
    padding: "8px",
    marginTop: "10px",
    marginBottom: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    background: "transparent",
    color: "inherit",
    display: "block"
  }}
/>
              <div className="row">
                <button onClick={() => setOpenAssignModal(false)}>Cancel</button>
                <button onClick={createTask}>Create</button>
              </div>
            </div>
          </div>
        )}

        {!selectedEmp && <p className="select-an-employee">Select an employee or add an employee</p>}
        {loading && <p>Loading...</p>}

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
          <p className="select-prompt">Select a task from the list to view details.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- OTHER VIEWS ---------------- */



function InboxView() {
  return <div className="cobox">Inbox UI here</div>;
}

function ProgressView() {
  return <div className="cobox">Progress UI here</div>;
}
