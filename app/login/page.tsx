"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import "./login.css";

export default function Page() {
  const { data: session } = useSession();

  if (!session)
    return (
      <div className="login-page">
        <div className="login-box">
          <h1 className="login-title">Task Manager</h1>
          <p className="login-subtitle">Sign in to continue</p>

          <button className="google-btn" onClick={() => signIn("google", { callbackUrl: "/" })}>
            <img src="/google.png" className="google-icon" />
            Continue with Google
          </button>
        </div>
      </div>
    );

  
}
