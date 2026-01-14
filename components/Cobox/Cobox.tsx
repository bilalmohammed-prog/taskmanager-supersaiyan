"use client";

import "./Cobox.css";
import { useState, useEffect } from "react";
import Image from "next/image";

import { useSession } from "next-auth/react";

type Section = "tasks" | "inbox" | "progress" | "teamTasks";

type Task = {
  empID: string;
  id: string;
  task: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  proof: string;
  durationHours: number;
  submittedAt: Date;
  isEditing?: boolean;
};





function prettyDateTime(dt: string | Date | number) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return String(dt);

  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function safeISO(dt: string | Date) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}








type Props = {
  section: Section;
  selectedEmp: { empID: string; name: string } | null;

  openAssignModal: boolean;
  setOpenAssignModal: React.Dispatch<React.SetStateAction<boolean>>;
  currentManagerID: string | null;
};


export default function Cobox({ section, selectedEmp, openAssignModal, setOpenAssignModal, currentManagerID }: Props) {


  


 
  return null;
}

/* ---------------- TEAM TASKS ---------------- */





/* ---------------- OTHER VIEWS ---------------- */






