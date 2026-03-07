"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
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
  }, []); // 🔴 no need for currentManagerID anymore

  return (
    <div
  className="
    fixed inset-0
    bg-black/65
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
    bg-[#1e1e1e]
    border border-white/10
    text-[#eaeaea]
    shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]
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
    bg-white/10 text-white
    text-[18px] font-bold
    transition hover:bg-white/20
  "
>
  ×
</button>


        <div className="mb-[18px]">
  <h2 className="text-[20px] font-medium text-[#f5f5f5]">
    Select Employee
  </h2>
</div>


        <div className="switch-emp-list-container">

          {loading && (
            <div className="flex flex-col items-center justify-center py-[40px] text-white/70">
  <div
    className="
      w-[40px] h-[40px]
      border-[3px] border-white/20
      border-t-white
      rounded-full
      animate-spin
      mb-[16px]
    "
  />
  <p>Loading employees...</p>
</div>

          )}

          {/* EMPTY STATE */}
          {!loading && employees.length === 0 && (
            <div className="flex items-center justify-center py-[40px] text-white/50 italic">
  No employees found
</div>

          )}

          {/* GRID */}
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
    border border-white/40
    bg-white/5
    transition-all duration-200
    hover:bg-white/10 hover:-translate-y-[2px]
    hover:shadow-[0_10px_24px_rgba(0,0,0,0.5)]
    ${selectedEmpID === e.id ? "bg-white/15 border-white/30 shadow-none translate-y-0" : ""}
  `}
                  onClick={() => onSelect({
  id: e.id,
  name: e.name,
  user_id: e.user_id,
  emp_id: e.emp_id
})
}
                >
                  <div className="text-white text-[16px] font-medium">
{e.name}</div>
                  <div className="text-white/55 text-[13px]">
ID: {e.id}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
