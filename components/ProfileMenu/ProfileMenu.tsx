"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuthEmployee } from "@/components/Context/AuthEmployeeContext";

export default function ProfileMenu() {
  
  const { employee } = useAuthEmployee();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();


  // Handle click outside and Escape key
  useEffect(() => {
    function handleGlobalEvents(e: MouseEvent | KeyboardEvent): void {
      if (e instanceof MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleGlobalEvents);
    document.addEventListener("keydown", handleGlobalEvents);
    return () => {
      document.removeEventListener("mousedown", handleGlobalEvents);
      document.removeEventListener("keydown", handleGlobalEvents);
    };
  }, []);

  const initials = employee?.name?.charAt(0).toUpperCase() ?? "?";

  async function handleLogout(): Promise<void> {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }



  return (
    <div className="profile-wrapper" ref={wrapperRef}>
      {/* Profile Toggle Button */}
      <button
        type="button"
        className="profile-icon"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {initials}
      </button>

      {/* Dropdown Menu: 
          We use the "show" class from your CSS to trigger the 
          opacity/transform animations.
      */}
      <div className={`profile-dropdown ${open ? "show" : ""}`} role="menu">
        <div className="profile-header">
          <p className="profile-name">{employee?.name}</p>
          <p className="profile-email">{employee?.email}</p>
          <span className="profile-id">ID: {employee?.emp_id}</span>
        </div>

        <button 
          className="logout-btn" 
          onClick={handleLogout}
          role="menuitem"
        >
          Logout
        </button>
      </div>
    </div>
  );
}