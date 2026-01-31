"use client";

import { supabase } from "@/lib/supabaseClient";
import "./login.css";

export default function LoginPage() {
  const handleGoogleLogin = async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/userTasks`,
      },
    });
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">Task Manager</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <img src="/google.png" className="google-icon" alt="Google" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
