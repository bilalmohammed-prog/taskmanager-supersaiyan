"use client";

import { createContext, useContext, useState } from "react";

type SelectedEmp = { emp_id: string; name: string } | null;

type DashboardContextType = {
  selectedEmp: SelectedEmp;
  setSelectedEmp: React.Dispatch<React.SetStateAction<SelectedEmp>>;
  openAssignModal: boolean;
  setOpenAssignModal: React.Dispatch<React.SetStateAction<boolean>>;
  currentManagerID: string;
  setcurrentManagerID: React.Dispatch<React.SetStateAction<string | "">>;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedEmp, setSelectedEmp] = useState<SelectedEmp>(null);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [currentManagerID, setcurrentManagerID] = useState<string | "">("");
  return (
    <DashboardContext.Provider
      value={{ selectedEmp, setSelectedEmp, openAssignModal, setOpenAssignModal, currentManagerID, setcurrentManagerID }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
