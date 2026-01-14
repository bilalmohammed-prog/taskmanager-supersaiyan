"use client";

import { useState, useEffect } from "react";

import "./Cobox/Cobox.css"; // reuse styles if needed
import { useDashboard } from "./Context/DashboardContext";

type EmployeeProgress = {
  empID: string;
  name: string;
  email: string;
  completed: number;
  total: number;
};



  



export default function ProgressView() {
  
  const { currentManagerID } = useDashboard();
  
  const [data, setData] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!currentManagerID) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/teamProgress?managerID=${currentManagerID}`);
        const report = await res.json();
        setData(report);
      } catch (err) {
        console.error("Error loading progress", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [currentManagerID]);

  // Derived Summary Stats
  const overall = data.reduce(
    (acc, curr) => ({
      total: acc.total + curr.total,
      completed: acc.completed + curr.completed,
    }),
    { total: 0, completed: 0 }
  );

  const getPercentage = (completed: number, total: number) => 
    total === 0 ? 0 : Math.round((completed / total) * 100);

  if (loading) return <div className="cobox">
    <div className="teamSpinner"></div>
    <p className="loadingTeamMetrics">Loading team metrics...</p>
    </div>;

  return (
    <div className="coboxContainer">
      <div className="progress-view-container">
        <div className="progress-header"><h2>Team Progress Dashboard</h2></div>
        <div className="progress-grid">
          
          {/* TEAM SUMMARY CARD */}
          <div className="progress-card summary">
            <h3 className="emp-name">Total Team Output</h3>
            <div className="progress-stat">
              <span className="stat-label">Tasks Completed</span>
              <span className="stat-number">
                {overall.completed} / {overall.total}
              </span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill high" style={{ width: `${getPercentage(overall.completed, overall.total)}%` }}></div>
            </div>
          </div>

          {/* INDIVIDUAL CARDS */}
          {data.map((emp) => {
            const pct = getPercentage(emp.completed, emp.total);
            return (
              <div className="progress-card" key={emp.empID}>
                <h3 className="emp-name">{emp.name}</h3>
                <p className="emp-id">ID: {emp.empID}</p>
                <div className="progress-stat">
                  <span className="stat-label">Completion</span>
                  <span className="stat-number">{emp.completed} / {emp.total}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className={`progress-bar-fill ${pct < 40 ? 'low' : pct < 80 ? 'med' : 'high'}`} 
                       style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}