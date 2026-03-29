"use client";

import { useState, useEffect } from "react";
import { getEmployeeSwitch } from "@/lib/api";

type Employee = {
  id: string;
  name: string;
  user_id: string;
  emp_id: string;
};

export default function SwitchEmpPopup({
  onClose,
  onSelect,
  selectedEmpID
}: {
  onClose: () => void;
  onSelect: (emp: { name: string; id: string; user_id: string; emp_id: string }) => void;
  selectedEmpID: string | null;

}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEmployees() {
    try {
      setLoading(true);

      const { employees } = await getEmployeeSwitch();

      setEmployees(employees);
    } catch (err) {
      console.error("Failed to load employees", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        className="relative flex max-h-[80vh] w-[90%] max-w-[450px] flex-col rounded-xl border border-border bg-card p-6 text-foreground shadow-sm"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-md bg-muted text-lg font-bold text-foreground transition-all duration-200 hover:bg-accent"
        >
          ×
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-medium text-foreground">
            Select Employee
          </h2>
        </div>

        <div className="switch-emp-list-container">

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-foreground" />
              <p>Loading employees...</p>
            </div>
          )}

          {!loading && employees.length === 0 && (
            <div className="flex items-center justify-center py-10 text-muted-foreground italic">
              No employees found
            </div>
          )}

          {!loading && employees.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
              {employees.map(e => (
                <div
                  key={e.id}
                  className={`
                    mt-2
                    flex flex-col gap-1.5
                    rounded-lg
                    cursor-pointer
                    border
                    bg-background
                    p-4
                    transition-all duration-200
                    hover:bg-accent/50
                    ${selectedEmpID === e.id
                      ? "border-primary/50 bg-accent shadow-none"
                      : "border-border"
                    }
                  `}
                  onClick={() => onSelect({
                    id: e.id,
                    name: e.name,
                    user_id: e.user_id,
                    emp_id: e.emp_id
                  })}
                >
                  <div className="text-base font-medium text-foreground">
                    {e.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {e.id}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
