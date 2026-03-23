"use client";

import { useState, useEffect, useRef } from "react";
import "./Cobox.css";
import { supabase } from "@/lib/supabase/client";
import { updateTask } from "@/actions/task/update";
import { useToast } from "@/components/providers/toast";

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
  const { addToast } = useToast();

  const initRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function loadTasks() {
      try {
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

        const { data: profile } = await supabase
          .from("profiles")
          .select("active_organization_id")
          .eq("id", user.id)
          .maybeSingle();

        const orgId = profile?.active_organization_id;

        if (!orgId) {
          setLoading(false);
          initRef.current = false;
          return;
        }

        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, description, due_date, status")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: true });

        if (mounted) {
          if (!error && data) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && mounted) {
        loadTasks();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function markCompleted(task: Task): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const orgId = session?.user
      ? (await supabase
          .from("profiles")
          .select("active_organization_id")
          .eq("id", session.user.id)
          .maybeSingle()
        ).data?.active_organization_id
      : null;

    if (!orgId) {
      addToast("No active organization", "error");
      return;
    }

    try {
      await updateTask(task.id, { status: "done" }, orgId);

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "done" } : t))
      );
      setSelectedTask((prev) =>
        prev && prev.id === task.id ? { ...prev, status: "done" } : prev
      );
    } catch {
      addToast("Failed to mark task completed", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6 h-full">

      {/* TASK LIST */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">You have no tasks.</p>
        )}

        {tasks.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTask(t)}
            className={`
              p-4 rounded-xl border cursor-pointer transition-all duration-200
              hover:-translate-y-0.5
              ${selectedTask?.id === t.id
                ? "bg-accent border-primary/50"
                : "bg-card border-border hover:border-border/80"
              }
            `}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{prettyDateTime(t.due_date)}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markCompleted(t);
                  }}
                  disabled={t.status === "done"}
                  className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t.status === "done" ? "Done" : "Complete"}
                </button>

                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    t.status === "done" ? "bg-green-500" : "bg-muted-foreground/30"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TASK DETAIL PANEL */}
      <div className="w-[280px] flex-shrink-0 bg-card border border-border rounded-xl p-5">
        {selectedTask ? (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">{selectedTask.title}</h2>
            <hr className="border-border" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <p className="text-sm text-foreground">{selectedTask.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deadline</p>
              <p className="text-sm text-foreground">{prettyDateTime(selectedTask.due_date)}</p>
            </div>
            {selectedTask.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTask.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">Select a task to view details</p>
          </div>
        )}
      </div>

    </div>
  );
}