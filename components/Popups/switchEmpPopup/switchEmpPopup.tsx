"use client";

import "./switchEmpPopup.css";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // 🔴 MISSING IMPORT

type Employee = {
  emp_id: string;
  name: string;
  user_id: string;
};

export default function SwitchEmpPopup({
  onClose,
  onSelect,
  selectedEmpID
}: {
  onClose: () => void;
  onSelect: (emp: { name: string; emp_id: string; user_id: string }) => void;
  selectedEmpID: string | null;
  currentManagerID: string | null;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEmployees() {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setEmployees([]);
        return;
      }

      const res = await fetch("/api/switchEmp", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json(); // 🔴 YOU WERE MISSING THIS

      setEmployees(Array.isArray(data.employees) ? data.employees : []);
    } catch (err) {
      console.error("Failed to load employees", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []); // 🔴 no need for currentManagerID anymore

  return (
    <div className="switch-emp-modal-overlay active" id="switchEmpModalOverlay">
      <div className="switch-emp-modal" role="dialog" aria-labelledby="switchEmpModalTitle" aria-modal="true">

        <button
          className="switch-emp-modal-close"
          aria-label="Close modal"
          onClick={onClose}
        >
          ×
        </button>

        <div className="switch-emp-modal-header">
          <h2 className="switch-emp-modal-title">Select Employee</h2>
        </div>

        <div className="switch-emp-list-container">

          {loading && (
            <div className="switch-emp-loading">
              <div className="switch-emp-spinner"></div>
              <p>Loading employees...</p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && employees.length === 0 && (
            <div className="switch-emp-empty">
              <p>No employees found</p>
            </div>
          )}

          {/* GRID */}
          {!loading && employees.length > 0 && (
            <div className="switch-emp-grid">
              {employees.map(e => (
                <div
                  key={e.emp_id}
                  className={`switch-emp-card ${
                    selectedEmpID === e.emp_id ? "selected" : ""
                  }`}
                  onClick={() => onSelect({ emp_id: e.emp_id, name: e.name, user_id: e.user_id })}
                >
                  <div className="switch-emp-card-name">{e.name}</div>
                  <div className="switch-emp-card-id">ID: {e.emp_id}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
