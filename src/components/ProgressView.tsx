"use client";

import { useState, useEffect } from "react";
import { getTeamProgress } from "@/lib/api";
import "./Cobox.css";

type EmployeeProgress = {
  user_id: string;
  full_name: string;
  total_tasks: number;
  completed_tasks: number;
  total_hours: number;
};

export default function ProgressView() {
  const [data, setData] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const { employees } = await getTeamProgress();
        setData(employees);
      } catch (err) {
        console.error("Error loading progress", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const overall = data.reduce(
    (acc, curr) => ({
      total: acc.total + curr.total_tasks,
      completed: acc.completed + curr.completed_tasks,
    }),
    { total: 0, completed: 0 }
  );

  const getPercentage = (completed: number, total: number) =>
    total === 0 ? 0 : Math.round((completed / total) * 100);

  if (loading) {
    return (
      <div className="cobox">
        <div className="teamSpinner"></div>
        <p className="loadingTeamMetrics">Loading team metrics...</p>
      </div>
    );
  }

  return (
    <div className="coboxContainer">
      <div className="progress-view-container">
        <div className="progress-header">
          <h2>Team Progress Dashboard</h2>
        </div>

        <div className="progress-grid">
          {/* TEAM SUMMARY */}
          <div className="progress-card summary">
            <h3 className="emp-name">Total Team Output</h3>

            <div className="progress-stat">
              <span className="stat-label">Tasks Completed</span>
              <span className="stat-number">
                {overall.completed} / {overall.total}
              </span>
            </div>

            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill high"
                style={{
                  width: `${getPercentage(
                    overall.completed,
                    overall.total
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* EMPLOYEE CARDS */}
          {data.map((emp, index) => {
            const pct = getPercentage(emp.completed_tasks, emp.total_tasks);

            return (
              <div className="progress-card" key={index}>
                <h3 className="emp-name">{emp.full_name}</h3>
                <p className="emp-id">{emp.user_id}</p>

                <div className="progress-stat">
                  <span className="stat-label">Completion</span>
                  <span className="stat-number">
                    {emp.completed_tasks} / {emp.total_tasks}
                  </span>
                </div>

                <div className="progress-bar-bg">
                  <div
                    className={`progress-bar-fill ${
                      pct < 40 ? "low" : pct < 80 ? "med" : "high"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
