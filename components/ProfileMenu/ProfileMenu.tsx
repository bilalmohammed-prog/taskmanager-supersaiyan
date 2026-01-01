"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function ProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [empID, setEmpID] = useState<string>("Loading...");

  const name = session?.user?.name || "User";
  const email = session?.user?.email || "";

  useEffect(() => {
    if (!email) return;

    async function fetchEmp() {
      try {
        const res = await fetch(`/api/get-emp?email=${email}`);
        const data = await res.json();
        setEmpID(data?.empID || "Not Registered");
      } catch {
        setEmpID("Error");
      }
    }

    fetchEmp();
  }, [email]);

  if (!session) return null;

  return (
    <div className="profile-wrapper">
      <div className="profile-icon" onClick={() => setOpen(o => !o)}>
        {name[0].toUpperCase()}
      </div>

      <div className={`profile-dropdown ${open ? "show" : ""}`}>
        <p className="profile-name">{name}</p>
        <p className="profile-email">{email}</p>
        <p className="profile-id">{empID}</p>

        <button
          className="logout-btn"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
