"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import "./Cobox.css";
import { useDashboard } from "@/components/providers/dashboard/DashboardContext";
import { supabase } from "@/lib/supabase/client";
import {
  getDisplayTasks,
  createTask as createTaskApi,
  updateTask,
  deleteTask as deleteTaskApi,
} from "@/lib/api";

type Task = {
  user_id: string;
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  isEditing?: boolean;
};

function prettyDateTime(dt: string | Date | number | null) {
  if (!dt) return "Not set";
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

function safeISO(dt: string | Date | null) {
  if (!dt) return "";
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
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const { selectedEmp, openAssignModal, setOpenAssignModal } = useDashboard();

  const userId = selectedEmp?.user_id ?? selectedEmp?.id;

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  function updateTaskInState(taskId: string, updates: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  }

  useEffect(() => {
    async function loadOrganization() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        setOrganizationId(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("id", uid)
        .maybeSingle();

      setOrganizationId(data?.active_organization_id ?? null);
    }

    loadOrganization();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      if (!userId) {
        setTasks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { tasks } = await getDisplayTasks(userId);
        setTasks(tasks);
      } catch (err) {
        console.error("Task load error", err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [userId]);

  async function createTask() {
    if (!userId) return alert("No employee selected");
    if (!organizationId) return alert("No active organization selected");

    const { title, description, dueDate } = newTask;

    if (!title.trim() || !description.trim() || !dueDate) {
      return alert("Please enter title, description and due date");
    }

    try {
      const { task: createdTask } = await createTaskApi({
        user_id: userId,
        organization_id: organizationId,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        status: "todo",
      });

      const normalizedTask: Task = {
        user_id: createdTask.user_id,
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description,
        due_date: createdTask.due_date,
        status: createdTask.status,
      };

      setTasks((prev) => [...prev, normalizedTask]);
      setOpenAssignModal(false);
      setNewTask({ title: "", description: "", dueDate: "" });
    } catch (err) {
      console.error("Failed to create task", err);
      alert("Failed to create task");
    }
  }

  async function saveTask(taskId: string) {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;

    const currentTitle = t.title || "";
    const currentDesc = t.description || "";

    if (!currentTitle.trim() || !currentDesc.trim() || !t.due_date) {
      alert("All fields (Title, Description, Due date) are required.");
      return;
    }

    try {
      await updateTask(taskId, {
        title: currentTitle.trim(),
        description: currentDesc.trim(),
        dueDate: t.due_date,
        status: t.status as
          | "todo"
          | "in_progress"
          | "blocked"
          | "done"
          | "pending"
          | "in-progress"
          | "completed",
      });

      updateTaskInState(taskId, { isEditing: false });

      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...t, description: currentDesc, isEditing: false });
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";

      alert(errorMessage);
      console.error("Save error:", err);
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await deleteTaskApi(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } catch (err) {
      console.error("Failed to delete task", err);
      alert("Failed to delete task");
    }
  }

  if (selectedEmp) {
    return (
      <div className="coboxContainer">
        <div className="cobox">
          {openAssignModal && (
            <div
              className="modalOverlay"
              onClick={(e) => e.target === e.currentTarget && setOpenAssignModal(false)}
            >
              <div className="modalBox">
                <h3>Assign Task</h3>
                <input
                  placeholder="Task Title"
                  value={newTask.title}
                  onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                />

                <input
                  type="datetime-local"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                />

                <textarea
                  placeholder="Enter Detailed Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
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
                    resize: "vertical",
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

          {!loading &&
            tasks.map((t) => (
              <div
                key={t.id}
                className={`container3 ${t.isEditing ? "editing" : ""} ${selectedTask?.id === t.id ? "active-card" : ""}`}
                onClick={() => !t.isEditing && setSelectedTask(t)}
              >
                <div className="taskText">
                  {!t.isEditing ? (
                    <>
                      <p>{t.title}</p> <br />
                      <p>{prettyDateTime(t.due_date)}</p>
                    </>
                  ) : (
                    <div className="edit-fields" onClick={(e) => e.stopPropagation()}>
                      <input
                        className="edit-input"
                        value={t.title}
                        onChange={(e) => updateTaskInState(t.id, { title: e.target.value })}
                      />
                      <textarea
                        className="edit-input"
                        value={t.description || ""}
                        placeholder="Description..."
                        onChange={(e) => updateTaskInState(t.id, { description: e.target.value })}
                      />
                      <input
                        type="datetime-local"
                        className="edit-input"
                        value={safeISO(t.due_date)}
                        onChange={(e) => updateTaskInState(t.id, { due_date: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="container2">
                  {!t.isEditing ? (
                    <>
                      <button
                        className="action-btn update-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBackupTask((b) => ({ ...b, [t.id]: { ...t } }));
                          updateTaskInState(t.id, { isEditing: true });
                        }}
                      >
                        <Image src="/svg/updateTask.svg" alt="update" width={32} height={32} />
                      </button>
                      <button
                        className="action-btn delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(t.id);
                        }}
                      >
                        <Image src="/svg/deleteTask.svg" alt="delete" width={32} height={32} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="action-btn update-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveTask(t.id);
                        }}
                      >
                        <Image src="/svg/updateTask.svg" alt="save" width={32} height={32} />
                      </button>
                      <button
                        className="action-btn delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const original = backupTask[t.id];
                          updateTaskInState(t.id, { ...original, isEditing: false });
                        }}
                      >
                        <Image src="/svg/deleteTask.svg" alt="cancel" width={32} height={32} />
                      </button>
                    </>
                  )}
                  <button className="checkbox" disabled />
                </div>
              </div>
            ))}
        </div>

        <div className="taskDescription">
          {selectedTask ? (
            <div className="description-content">
              <h2>{selectedTask.title}</h2>
              <hr />
              <div style={{ marginTop: "15px" }}>
                <strong>Description:</strong>
                <p style={{ opacity: 0.9, marginTop: "5px", whiteSpace: "pre-wrap" }}>
                  {selectedTask.description || "No description provided."}
                </p>
              </div>
              <p style={{ marginTop: "15px" }}>
                <strong>Status:</strong> {selectedTask.status}
              </p>
              <p>
                <strong>Due:</strong> {prettyDateTime(selectedTask.due_date)}
              </p>
            </div>
          ) : (
            <p className="select-promptTaskDesc">Select a task to view details</p>
          )}
        </div>
      </div>
    );
  }

  return <p className="select-an-employee">Select or add an employee to manage tasks</p>;
}
