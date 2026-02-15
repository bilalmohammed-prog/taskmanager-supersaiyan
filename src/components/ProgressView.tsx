"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import "./Cobox.css";

type EmployeeProgress = {
  name: string;
  email: string;
  total: number;
  completed: number;
};

export default function ProgressView() {
  const [data, setData] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setData([]);
          return;
        }

        const res = await fetch(`/api/teamProgress`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const report = await res.json();

        console.log("REPORT:", report);

        setData(Array.isArray(report) ? report : []);
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
      total: acc.total + curr.total,
      completed: acc.completed + curr.completed,
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
            const pct = getPercentage(emp.completed, emp.total);

            return (
              <div className="progress-card" key={index}>
                <h3 className="emp-name">{emp.name}</h3>
                <p className="emp-id">{emp.email}</p>

                <div className="progress-stat">
                  <span className="stat-label">Completion</span>
                  <span className="stat-number">
                    {emp.completed} / {emp.total}
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
