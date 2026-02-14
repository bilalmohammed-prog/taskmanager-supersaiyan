"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/supabaseClient";
import { useAuthEmployee } from "@/src/components/Context/AuthEmployeeContext";

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
    <div
  ref={wrapperRef}
  className="relative flex justify-center items-center mt-auto"
>

      {/* Profile Toggle Button */}
      <button
  type="button"
  onClick={() => setOpen(o => !o)}
  aria-haspopup="true"
  aria-expanded={open}
  className="
    w-[40px] h-[40px]
    rounded-full
    bg-white
    text-[#1e1e1e]
    font-semibold text-[16px]
    flex items-center justify-center
    cursor-pointer
    shadow-[0_2px_8px_rgba(0,0,0,0.4)]
    transition-all duration-200
    select-none
    hover:scale-[1.06]
  "
>
  {initials}
</button>


      {/* Dropdown Menu: 
          We use the "show" class from your CSS to trigger the 
          opacity/transform animations.
      */}
      <div
  role="menu"
  className={`
    absolute left-0 bottom-[calc(100%+16px)]
    w-[280px] max-w-[90vw]
    p-[20px_24px]
    rounded-[14px]
    bg-[#1e1e1e]
    border border-white/40
    shadow-[0_20px_60px_rgba(0,0,0,0.65),inset_0_0_0_1px_rgba(255,255,255,0.04)]
    backdrop-blur-[10px]
    flex flex-col gap-[16px]
    z-[99999]
    transition-all duration-300
    ${open
      ? "opacity-100 visible translate-y-0"
      : "opacity-0 invisible translate-y-[12px]"
    }

    max-[768px]:left-[-20px]
    max-[768px]:w-[260px]
    max-[768px]:max-w-[calc(100vw-32px)]
    max-[768px]:bottom-[calc(100%+12px)]
  `}
>

        <div className="profile-header">
          <p className="font-semibold text-[16.5px] text-white m-0">
  {employee?.name || metaName || "User"}
</p>

<p className="text-[13px] text-white/45 mt-[2px] mb-[12px] break-all">
  {employee?.email || ""}
</p>

<span
  className="
    text-[11px] font-bold uppercase tracking-[1px]
    text-[#cfcfcf]
    bg-[#1e1e1e]
    px-[10px] py-[4px]
    rounded-[12px]
    border border-white/20
    self-start
  "
>
  ID: {employee?.id || "Loading..."}
</span>


        </div>

        <button
  onClick={handleLogout}
  role="menuitem"
  className="
    w-full
    px-[16px] py-[12px]
    rounded-[10px]
    border border-red-500/25
    bg-red-500
    text-white
    text-[14px] font-semibold
    cursor-pointer
    transition-all duration-200
    hover:bg-red-600
  "
>
  Logout
</button>

      </div>
    </div>
  );
}