"use client";
import ClientLayout from "./(dashboard)/ClientLayout";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import "./globals.css";
export default function Page() {



  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // REDIRECT LOGIC: If logged in, go to userTasks immediately
    if (status === "authenticated") {
      router.push("/userTasks");
    }
  }, [status, router]);

  if (status === "loading") return <div className="loading">Loading...</div>;

  // If not logged in, show the Login UI WITHOUT ClientLayout
  if (!session) {
    return (
      <div className="login-page">
        <div className="login-box">
          <h1 className="login-title">Task Manager</h1>
          <button className="google-btn" onClick={() => signIn("google")}>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  

  

  
}
