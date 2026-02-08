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
// 1. Add this state at the top of ProfileMenu
const [metaName, setMetaName] = useState("");

// 2. Add this tiny effect to grab metadata instantly
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setMetaName(data.session?.user?.user_metadata?.full_name || "");
  });
}, []);

// 3. Update your initials line to use the fallback
const displayName = employee?.name || metaName;
const initials = displayName?.charAt(0).toUpperCase() ?? "?";
// INSERT THIS: Listen for login to refresh employee context
 // Watch 'employee' to know when it finally arrives
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
          <p className="profile-name">{employee?.name || metaName || "User"}</p>
<p className="profile-email">{employee?.email || ""}</p>
<span className="profile-id">
  ID: {employee?.emp_id || "Loading..."}
</span>

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