"use client";

import { useState, useEffect, useRef } from "react";
import { getTeamProgress } from "@/lib/api";

type EmployeeProgress = {
  user_id: string;
  full_name: string;
  total_tasks: number;
  completed_tasks: number;
  total_hours: number;
};

export default function ProgressView() {
  // POSSIBLE LARGE CLIENT COMPONENT
  const hydrationStartRef = useRef<number | null>(null);
  const renderCountRef = useRef(0);
  const [data, setData] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrationStartRef.current = performance.now();
    console.time("[perf] [Hydration] progress view");
    console.timeEnd("[perf] [Hydration] progress view");
  }, []);

  useEffect(() => {
    renderCountRef.current += 1;
    if (renderCountRef.current > 1) {
      console.info(`[perf] [Render] progress view render count=${renderCountRef.current} rows=${data.length}`);
    }
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const loadStart = performance.now();
        setLoading(true);
        const fetchStart = performance.now();
        const { employees } = await getTeamProgress();
        console.info(`[perf] [Fetch] progress view getTeamProgress ${performance.now() - fetchStart}ms`);
        setData(employees);
        console.info(`[perf] [Fetch] progress view load total ${performance.now() - loadStart}ms`);
      } catch (err) {
        console.error("Error loading progress", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // POSSIBLE RERENDER HOTSPOT
  const overall = data.reduce(
    (acc, curr) => ({
      total: acc.total + curr.total_tasks,
      completed: acc.completed + curr.completed_tasks,
    }),
    { total: 0, completed: 0 }
  );

  useEffect(() => {
    console.time("[perf] [Compute] progress view overall reduce");
    data.reduce(
      (acc, curr) => ({
        total: acc.total + curr.total_tasks,
        completed: acc.completed + curr.completed_tasks,
      }),
      { total: 0, completed: 0 }
    );
    console.timeEnd("[perf] [Compute] progress view overall reduce");
  }, [data]);

  const getPercentage = (completed: number, total: number) =>
    total === 0 ? 0 : Math.round((completed / total) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading team metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Team Progress Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* TEAM SUMMARY CARD */}
        <div className="bg-card border border-primary/40 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-foreground">Total Team Output</p>
          <p className="text-2xl font-semibold text-foreground">
            {overall.completed}
            <span className="text-base text-muted-foreground font-normal"> / {overall.total}</span>
          </p>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-700"
              style={{ width: `${getPercentage(overall.completed, overall.total)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {getPercentage(overall.completed, overall.total)}% completion
          </p>
        </div>

        {/* EMPLOYEE CARDS */}
        {data.map((emp, index) => {
          const pct = getPercentage(emp.completed_tasks, emp.total_tasks);
          const barColor =
            pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-blue-500" : "bg-amber-500";

          return (
            <div key={index} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">{emp.full_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{emp.user_id}</p>
              </div>

              <p className="text-xl font-semibold text-foreground">
                {emp.completed_tasks}
                <span className="text-sm text-muted-foreground font-normal"> / {emp.total_tasks} tasks</span>
              </p>

              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground">{pct}% complete</p>
            </div>
          );
        })}

      </div>
    </div>
  );
}
