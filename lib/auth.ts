// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { supabaseAdmin as supabase } from "./supabaseAdmin";

import NextAuth, { DefaultSession } from "next-auth"

// module augmentation
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The employee's custom ID. */
      emp_id?: string;
      managerid?: string;
    } & DefaultSession["user"]
  }

  interface User {
    emp_id?: string;
    managerid?: string;
  }
}
// Ensure 'export' is here!
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
callbacks: {
    async signIn({ user }) {
      const email = user.email!;
      const name = user.name || "Unknown";

      // 1️⃣ Check if employee already exists
      const { data: existingUser } = await supabase
        .from("empid")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      // 2️⃣ If not exists → insert into DB
      if (!existingUser) {
        const emp_id = "EMP" + Math.floor(100000 + Math.random() * 900000); // example
        const managerid = "no manager"; // you can change logic later

        const { error } = await supabase.from("empid").insert([
          {
            email,
            name,
            emp_id,
            managerid,
          },
        ]);

        if (error) {
          console.error("Error inserting employee:", error);
          return false;
        }
      }

      return true; // allow login
    },

    async session({ session }) {
      // attach emp_id to session (optional but powerful)
      const { data } = await supabase
        .from("empid")
        .select("emp_id, managerid")
        .eq("email", session?.user?.email)
        .single();

      if (session.user && data) {
  session.user.emp_id = data.emp_id;
  session.user.managerid = data.managerid;
}


      return session;
    },
  },

};