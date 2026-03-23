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
    <div
      className="
        fixed inset-0
        bg-black/50
        backdrop-blur-[6px]
        flex items-center justify-center
        z-[10000]
      "
    >
      <div
        role="dialog"
        className="
          relative
          w-[90%] max-w-[450px]
          max-h-[80vh]
          p-[30px]
          flex flex-col
          rounded-[14px]
          bg-card
          border border-border
          text-foreground
          shadow-lg
          animate-[fadeIn_.2s_ease]
        "
      >
        <button
          onClick={onClose}
          className="
            absolute top-[16px] right-[16px]
            w-[28px] h-[28px]
            flex items-center justify-center
            rounded-[6px]
            bg-muted text-foreground
            text-[18px] font-bold
            transition hover:bg-muted/80
          "
        >
          ×
        </button>

        <div className="mb-[18px]">
          <h2 className="text-[20px] font-medium text-foreground">
            Select Employee
          </h2>
        </div>

        <div className="switch-emp-list-container">

          {loading && (
            <div className="flex flex-col items-center justify-center py-[40px] text-muted-foreground">
              <div
                className="
                  w-[40px] h-[40px]
                  border-[3px] border-border
                  border-t-foreground
                  rounded-full
                  animate-spin
                  mb-[16px]
                "
              />
              <p>Loading employees...</p>
            </div>
          )}

          {!loading && employees.length === 0 && (
            <div className="flex items-center justify-center py-[40px] text-muted-foreground italic">
              No employees found
            </div>
          )}

          {!loading && employees.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[14px]">
              {employees.map(e => (
                <div
                  key={e.id}
                  className={`
                    mt-[10px]
                    flex flex-col gap-[6px]
                    p-[14px_16px]
                    rounded-[10px]
                    cursor-pointer
                    border
                    bg-background
                    transition-all duration-200
                    hover:bg-accent/50 hover:-translate-y-[2px]
                    ${selectedEmpID === e.id
                      ? "bg-accent border-primary/50 shadow-none translate-y-0"
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
                  <div className="text-foreground text-[16px] font-medium">
                    {e.name}
                  </div>
                  <div className="text-muted-foreground text-[13px]">
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