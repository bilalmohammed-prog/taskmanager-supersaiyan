"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { createTask } from "@/actions/task/create";
import { updateTask } from "@/actions/task/update";
import { assignTaskToResource } from "@/actions/task/assign";
import { listOrgMembers } from "@/actions/organization/listOrgMembers";
import { supabase } from "@/lib/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { usePageHeader } from "@/components/layout/PageHeaderContext";
import { Button } from "@/components/ui/button";
import { ExpandableDescription } from "@/components/tasks/ExpandableDescription";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/providers/toast";
import type { Enums } from "@/lib/types/database";

type EmployeeTask = {
  task_id: string;
  title: string;
  status: TaskStatus | null;
  description: string | null;
  due_date: string | null;
  project_id: string | null;
  allocated_hours: number | null;
};

type ProjectOption = {
  id: string;
  name: string;
};

type TaskStatus = Enums<"task_status">;

type TaskJoinRow = {
  id: string;
  title: string;
  status: TaskStatus | null;
  description: string | null;
  due_date: string | null;
  project_id: string | null;
  deleted_at: string | null;
};

type AssignmentTaskRow = {
  task_id: string;
  allocated_hours: number | null;
  tasks: TaskJoinRow | TaskJoinRow[] | null;
};

function mapAssignmentRowsToEmployeeTasks(rows: AssignmentTaskRow[]): EmployeeTask[] {
  return rows.flatMap((row) => {
    const joinedTask = toTaskJoin(row);
    if (!joinedTask) {
      return [];
    }

    return [
      {
        task_id: row.task_id,
        title: joinedTask.title,
        status: joinedTask.status,
        description: joinedTask.description,
        due_date: joinedTask.due_date,
        project_id: joinedTask.project_id,
        allocated_hours: row.allocated_hours,
      },
    ];
  });
}

function toTaskJoin(row: AssignmentTaskRow): TaskJoinRow | null {
  if (!row.tasks) {
    return null;
  }

  return Array.isArray(row.tasks) ? (row.tasks[0] ?? null) : row.tasks;
}

export default function EmployeeTasksPage() {
  const role = useOrgRole();
  const canManage = role === "owner" || role === "admin" || role === "manager";
  const { addToast } = useToast();
  const { setPageHeader } = usePageHeader();

  const { orgId, employeeId } = useParams<{ orgId: string; employeeId: string }>();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [employeeName, setEmployeeName] = useState("Employee");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const fetchEmployeeTasks = useCallback(async () => {
    const { data } = await supabase
      .from("assignments")
      .select(
        `
          task_id,
          allocated_hours,
            tasks!inner(id, title, status, description, due_date, project_id, deleted_at)
        `
      )
      .eq("user_id", employeeId)
      .eq("organization_id", orgId)
      .is("tasks.deleted_at", null);

    return mapAssignmentRowsToEmployeeTasks((data ?? []) as AssignmentTaskRow[]);
  }, [employeeId, orgId]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const members = await listOrgMembers(orgId);
        const match = members.data?.find((m) => m.user_id === employeeId);
        if (match) {
          setEmployeeName(match.name);
        }

        const normalizedTasks = await fetchEmployeeTasks();

        setTasks(normalizedTasks);

        const { data: projectData } = await supabase
          .from("projects")
          .select("id, name")
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("name", { ascending: true });

        setProjects((projectData ?? []).map((p) => ({ id: p.id, name: p.name })));
      } finally {
        setLoading(false);
      }
    }

    if (orgId && employeeId) {
      void load();
    }
  }, [orgId, employeeId, fetchEmployeeTasks]);

  useEffect(() => {
    setPageHeader(
      <div className="flex w-full items-center justify-between gap-2">
        <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900">
          Tasks · {employeeName}
        </h1>

        {canManage && (
          <Button
            className="h-8 border-transparent bg-indigo-600 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-2 h-4 w-4 opacity-90" />
            Add Task
          </Button>
        )}
      </div>
    );

    return () => {
      setPageHeader(null);
    };
  }, [canManage, employeeName, setPageHeader]);

  async function handleCreate() {
    if (!title.trim() || !dueDate) {
      return;
    }

    try {
      setCreating(true);
      const created = await createTask(
        title.trim(),
        description.trim() || undefined,
        dueDate,
        orgId,
        selectedProjectId || null
      );

      await assignTaskToResource(created.id, employeeId);

      setTasks((prev) => [
        {
          task_id: created.id,
          title: created.title,
          status: created.status,
          description: created.description,
          due_date: created.due_date,
          project_id: created.project_id,
          allocated_hours: null,
        },
        ...prev,
      ]);

      setTitle("");
      setDescription("");
      setDueDate("");
      setSelectedProjectId("");
      setShowCreate(false);
      addToast("Task created", "success");
    } catch {
      addToast("Failed to create task", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleTitleCommit(taskId: string, nextTitle: string) {
    try {
      await updateTask(taskId, { title: nextTitle }, orgId);
    } catch {
      setTasks(await fetchEmployeeTasks());
      addToast("Failed to update title", "error");
    }
  }

  async function handleDescriptionCommit(taskId: string, nextDescription: string) {
    try {
      await updateTask(taskId, { description: nextDescription || null }, orgId);
    } catch {
      setTasks(await fetchEmployeeTasks());
      addToast("Failed to update description", "error");
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((task) => (task.task_id === taskId ? { ...task, status } : task))
    );

    try {
      await updateTask(taskId, { status }, orgId);
    } catch {
      setTasks(await fetchEmployeeTasks());
      addToast("Failed to update status", "error");
    }
  }

  async function handleDueDateChange(taskId: string, nextDueDate: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId
          ? {
              ...task,
              due_date: nextDueDate || null,
            }
          : task
      )
    );

    try {
      await updateTask(taskId, { due_date: nextDueDate || null }, orgId);
    } catch {
      setTasks(await fetchEmployeeTasks());
      addToast("Failed to update due date", "error");
    }
  }

  async function handleProjectChange(taskId: string, projectId: string | null) {
    setTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId
          ? {
              ...task,
              project_id: projectId,
            }
          : task
      )
    );

    try {
      await updateTask(taskId, { project_id: projectId }, orgId);
    } catch {
      setTasks(await fetchEmployeeTasks());
      addToast("Failed to update project", "error");
    }
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-2 pb-12">
      <section>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,2fr)_200px_140px_140px] items-center gap-4 border-b border-zinc-200/80 bg-zinc-50/80 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid">
            <div>Task</div>
            <div>Assigned Workspace</div>
            <div>Status</div>
            <div>Due Date</div>
          </div>

          <div className="flex flex-col">
            {loading && (
              <div className="px-4 py-4 text-sm text-zinc-500">Loading tasks...</div>
            )}

            {!loading && tasks.length === 0 && (
              <div className="px-4 py-4 text-sm text-zinc-500">No tasks assigned to this employee.</div>
            )}

            {!loading &&
              tasks.map((task) => (
                <div
                  key={task.task_id}
                  className="group flex flex-col items-start gap-2.5 border-t border-zinc-100 px-4 py-3 transition-colors hover:bg-zinc-50/50 first:border-t-0 md:grid md:grid-cols-[minmax(0,2fr)_200px_140px_140px] md:items-center md:gap-4"
                >
                  <div className="flex w-full min-w-0 flex-col">
                    <input
                      value={task.title}
                      onChange={(e) =>
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.task_id === task.task_id
                              ? {
                                  ...t,
                                  title: e.target.value,
                                }
                              : t
                          )
                        )
                      }
                      onBlur={(e) => {
                        void handleTitleCommit(task.task_id, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      disabled={!canManage}
                      className="w-full truncate bg-transparent text-[15px] font-medium text-foreground outline-none disabled:cursor-default"
                    />
                    <ExpandableDescription
                      value={task.description ?? ""}
                      onChange={(nextValue) =>
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.task_id === task.task_id
                              ? {
                                  ...t,
                                  description: nextValue,
                                }
                              : t
                          )
                        )
                      }
                      onCommit={(nextValue) => {
                        void handleDescriptionCommit(task.task_id, nextValue);
                      }}
                      disabled={!canManage}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex w-full items-center">
                    <Select
                      value={task.project_id ?? "__none__"}
                      onValueChange={(value) => {
                        void handleProjectChange(task.task_id, value === "__none__" ? null : value);
                      }}
                      disabled={!canManage}
                    >
                      <SelectTrigger className="h-7 w-full border-none bg-transparent px-0 text-xs text-zinc-500 shadow-none focus-visible:ring-0">
                        <SelectValue placeholder="No workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No workspace</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center">
                    <Select
                      value={(task.status ?? "todo") as TaskStatus}
                      onValueChange={(value) => {
                        void handleStatusChange(task.task_id, value as TaskStatus);
                      }}
                      disabled={!canManage}
                    >
                      <SelectTrigger className="h-8 w-full min-w-32 bg-background text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="done">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="date"
                      value={task.due_date ?? ""}
                      onChange={(e) => handleDueDateChange(task.task_id, e.target.value)}
                      className="h-8 w-full min-w-36 rounded-md border border-input bg-background px-3 text-xs"
                      disabled={!canManage}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {showCreate && canManage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.currentTarget === e.target && setShowCreate(false)}
        >
          <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Create Task</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                placeholder="Task title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Add task details"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Project (optional)</label>
              <Select
                value={selectedProjectId || "__none__"}
                onValueChange={(value) => setSelectedProjectId(value === "__none__" ? "" : value)}
              >
                <SelectTrigger className="h-9 w-full bg-background text-sm">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !title.trim() || !dueDate}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
