"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Calendar, CheckSquare, ChevronDown, Plus, Square } from "lucide-react";
import { listTasksByProject } from "@/actions/task/listByProject";
import { updateTask } from "@/actions/task/update";
import { createTask } from "@/actions/task/create";
import { deleteTask as deleteTaskAction } from "@/actions/task/delete";
import type { Tables, Enums } from "@/lib/types/database";
import type { TablesUpdate } from "@/lib/types/database";
import { listOrgMembers } from "@/actions/organization/listOrgMembers";
import { assignTaskToResource } from "@/actions/task/assign";
import { listProjectMembers } from "@/actions/project/listProjectMembers";
import { assignProjectMember } from "@/actions/project/assignProjectMember";
import { removeProjectMember } from "@/actions/project/removeProjectMember";
import { useOrgRole } from "@/hooks/useOrgRole";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";


type TaskWithAssignee = Tables<"tasks"> & {
  assignee_id: string | null;
  assignee_name: string | null;
};

type TaskStatus = Enums<"task_status">;
type HumanResource = {
  user_id: string;
  name: string;
};

type ProjectRecord = Pick<Tables<"projects">, "id" | "name">;

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getTaskStatusLabel(status: TaskStatus | null) {
  if (status === "in_progress") return "In Progress";
  if (status === "done") return "Completed";
  if (status === "blocked") return "Blocked";
  return "To Do";
}

function getTaskStatusBadgeClass(status: TaskStatus | null) {
  if (status === "done") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  }

  if (status === "in_progress") {
    return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
  }

  if (status === "blocked") {
    return "bg-amber-50 text-amber-700 border-amber-200/60";
  }

  return "bg-zinc-100 text-zinc-700 border-zinc-200/60";
}

export default function ProjectWorkspacePage() {
  const role = useOrgRole();
  const canManage = role === "owner" || role === "admin" || role === "manager";
  const [projectMembers, setProjectMembers] = useState<HumanResource[]>([]);
  const [showProjectAssign, setShowProjectAssign] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<HumanResource[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const { orgId, projectId } = useParams<{
    orgId: string;
    projectId: string;
  }>();
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedProjectMember, setSelectedProjectMember] = useState<string>("");
  const [projectName, setProjectName] = useState("Project");

  useEffect(() => {
    async function load() {
      setProjectMembers([]);  // reset on project change
      const humansResult = await listOrgMembers(orgId);
      if (!humansResult.error && humansResult.data) {
        setEmployees(
          humansResult.data.map((h) => ({
            user_id: h.user_id,
            name: h.name,
          }))
        );
      } else {
        setEmployees([]);
      }

      const { data: projectData } = await supabase
        .from("projects")
        .select("id, name")
        .eq("id", projectId)
        .eq("organization_id", orgId)
        .maybeSingle<ProjectRecord>();

      if (projectData?.name) {
        setProjectName(projectData.name);
      }

      const members = await listProjectMembers(projectId);
      setProjectMembers(members);

      setLoading(true);
      const data = await listTasksByProject(projectId, orgId);
      setTasks(data);
      setLoading(false);
    }

    if (projectId && orgId) load();
  }, [projectId, orgId]);

  function updateLocal(id: string, updates: TablesUpdate<"tasks">) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  async function commitUpdate(id: string, updates: TablesUpdate<"tasks">) {
    try {
      setSavingId(id);
      await updateTask(id, updates, orgId);
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate() {
    if (!title.trim() || !dueDate) return;

    try {
      setCreating(true);

      const created = await createTask(title.trim(), "", dueDate, orgId, projectId);

      const newTask: TaskWithAssignee = {
        ...created,
        assignee_id: null,
        assignee_name: null,
      };

      if (selectedEmployee) {
        await assignTaskToResource(created.id, selectedEmployee);

        newTask.assignee_name =
          employees.find((e) => e.user_id === selectedEmployee)?.name ?? null;
      }

      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
      setDueDate("");
      setShowCreate(false);
    } finally {
      setCreating(false);
    }

    setSelectedEmployee("");
  }

  async function handleDelete(id: string) {
    const backup = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTaskAction(id, orgId);
    } catch {
      setTasks(backup);
    }
  }

  return (
    <div className="flex w-full max-w-5xl flex-col space-y-10 pb-16">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Project: {projectName}</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage tasks and team members for this project.</p>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <select
                value={selectedProjectMember}
                onChange={(e) => setSelectedProjectMember(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-3 pr-10 text-sm text-zinc-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select project member</option>
                {projectMembers.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            <Button
              variant="outline"
              className="h-10 border-zinc-200 bg-white px-4 font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              onClick={() => setShowProjectAssign(true)}
            >
              <Plus className="mr-2 h-4 w-4 text-zinc-500" />
              Assign Member
            </Button>

            <Button
              variant="outline"
              className="h-10 border-zinc-200 bg-white px-4 font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              disabled={!selectedProjectMember}
              onClick={async () => {
                if (!selectedProjectMember) return;

                await removeProjectMember(projectId, selectedProjectMember);
                setProjectMembers((prev) =>
                  prev.filter((member) => member.user_id !== selectedProjectMember)
                );
                setSelectedProjectMember("");
              }}
            >
              Remove Member
            </Button>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Tasks</h2>
          {canManage && (
            <Button
              className="h-10 border-transparent bg-indigo-600 px-5 font-medium text-white shadow-sm hover:bg-indigo-700"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mr-2 h-4 w-4 opacity-90" />
              Add Task
            </Button>
          )}
        </div>

        <div className="w-full">
          <div className="hidden grid-cols-[80px_220px_minmax(250px,1fr)_170px_140px] items-center gap-4 border-b border-zinc-200/80 px-4 py-3 text-sm font-semibold text-zinc-500 md:grid">
            <div className="flex justify-center">
              <span className="sr-only">Select Task</span>
            </div>
            <div className="text-left">Assigned</div>
            <div className="text-left">Title</div>
            <div className="text-left">Status</div>
            <div className="text-left">Due</div>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {loading ? (
              <div className="rounded-lg border border-zinc-200/80 bg-white px-4 py-4 text-sm text-zinc-500 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
                Loading...
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex flex-col items-start gap-3 rounded-lg border border-zinc-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors hover:border-zinc-300 md:grid md:grid-cols-[80px_220px_minmax(250px,1fr)_170px_140px] md:items-center md:py-3.5"
                >
                  <div className="hidden cursor-pointer justify-center text-zinc-300 transition-colors group-hover:text-indigo-500 md:flex">
                    {task.status === "done" ? (
                      <CheckSquare className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex w-full items-center gap-2.5">
                    {task.assignee_name ? (
                      <>
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 text-[10px] font-bold text-indigo-700">
                          {task.assignee_name.charAt(0)}
                        </div>
                        <select
                          value={task.assignee_id || ""}
                          onChange={async (e) => {
                            const resourceId = e.target.value;

                            await assignTaskToResource(task.id, resourceId || null);

                            const emp = projectMembers.find((m) => m.user_id === resourceId);

                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id
                                  ? {
                                      ...t,
                                      assignee_id: resourceId,
                                      assignee_name: emp?.name ?? null,
                                    }
                                  : t
                              )
                            );
                          }}
                          className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-medium text-zinc-900 outline-none"
                        >
                          <option value="">Unassigned</option>
                          {projectMembers.map((emp) => (
                            <option key={emp.user_id} value={emp.user_id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <div className="flex w-full items-center gap-2.5">
                        <span className="flex items-center gap-1.5 text-sm font-medium italic text-zinc-400">
                          <AlertCircle className="h-4 w-4" />
                          Unassigned
                        </span>
                        <select
                          value={task.assignee_id || ""}
                          onChange={async (e) => {
                            const resourceId = e.target.value;

                            await assignTaskToResource(task.id, resourceId || null);

                            const emp = projectMembers.find((m) => m.user_id === resourceId);

                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id
                                  ? {
                                      ...t,
                                      assignee_id: resourceId,
                                      assignee_name: emp?.name ?? null,
                                    }
                                  : t
                              )
                            );
                          }}
                          className="min-w-0 flex-1 appearance-none bg-transparent text-sm text-zinc-500 outline-none"
                        >
                          <option value="">Unassigned</option>
                          {projectMembers.map((emp) => (
                            <option key={emp.user_id} value={emp.user_id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex w-full min-w-0 flex-col">
                    <input
                      value={task.title}
                      onChange={(e) => updateLocal(task.id, { title: e.target.value })}
                      onBlur={(e) => commitUpdate(task.id, { title: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      className={`w-full truncate bg-transparent text-[15px] font-medium outline-none ${task.status === "done" ? "text-zinc-500 line-through" : "text-zinc-900"}`}
                    />
                    <div className="mt-2 flex items-center gap-3 md:hidden">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${task.status === "done" ? "bg-emerald-50 text-emerald-700" : task.status === "in_progress" ? "bg-indigo-50 text-indigo-700" : task.status === "blocked" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-700"}`}>
                        {getTaskStatusLabel(task.status)}
                      </span>
                      <span className="flex items-center text-xs text-zinc-500">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDueDate(task.due_date)}
                      </span>
                      {savingId === task.id && (
                        <span className="text-xs text-zinc-500">Saving...</span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex md:flex-col md:items-start md:gap-2">
                    <select
                      value={task.status ?? "todo"}
                      onChange={(e) => {
                        const value = e.target.value as TaskStatus;
                        updateLocal(task.id, { status: value });
                        commitUpdate(task.id, { status: value });
                      }}
                      className={`appearance-none rounded-md border px-2.5 py-1 text-[13px] font-medium outline-none ${getTaskStatusBadgeClass(task.status)}`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Completed</option>
                    </select>
                    {savingId === task.id && <span className="text-xs text-zinc-500">Saving...</span>}
                  </div>

                  <div className="hidden md:flex md:items-center md:gap-2">
                    <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="date"
                      value={task.due_date ?? ""}
                      onChange={(e) => updateLocal(task.id, { due_date: e.target.value })}
                      onBlur={(e) => commitUpdate(task.id, { due_date: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") {
                          e.currentTarget.blur();
                        }
                      }}
                      className="bg-transparent text-sm font-medium text-zinc-600 outline-none"
                    />
                  </div>

                  {canManage && (
                    <div className="flex w-full justify-end md:hidden">
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[400px] space-y-3 rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Add Task</h2>

            <input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((emp) => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>

              <button
                disabled={creating}
                onClick={handleCreate}
                className="rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assigningTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[400px] space-y-3 rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Assign Employee</h2>

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAssigningTaskId(null)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!selectedEmployee) return;

                  await assignTaskToResource(assigningTaskId, selectedEmployee);

                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === assigningTaskId
                        ? {
                            ...t,
                            assignee_id: selectedEmployee,
                            assignee_name:
                              employees.find((e) => e.user_id === selectedEmployee)?.name ?? null,
                          }
                        : t
                    )
                  );

                  setAssigningTaskId(null);
                  setSelectedEmployee("");
                }}
                className="rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[400px] space-y-3 rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Assign Project Member</h2>

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white p-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select employee</option>
              {employees
                .filter((e) => !projectMembers.some((m) => m.user_id === e.user_id))
                .map((emp) => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.name}
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowProjectAssign(false)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  if (!selectedEmployee) return;

                  await assignProjectMember(projectId, selectedEmployee, orgId);

                  const emp = employees.find((e) => e.user_id === selectedEmployee);

                  if (emp) {
                    setProjectMembers((prev) => [...prev, emp]);
                  }

                  setSelectedEmployee("");
                  setShowProjectAssign(false);
                }}
                className="rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-sm text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
