"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./globals.css";

export default function Page() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth(): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/userTasks");
        return;
      }

      setCheckingAuth(false);
    }

    checkAuth();
  }, [router]);

  const handleGoogleLogin = async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/userTasks`,
      },
    });
  };

  if (checkingAuth) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">Task Manager</h1>

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
