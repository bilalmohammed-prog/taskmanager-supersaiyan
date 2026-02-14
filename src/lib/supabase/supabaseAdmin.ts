import { createClient } from "@supabase/supabase-js";

// This client is for SERVER-SIDE use only.
// It uses the SERVICE_ROLE_KEY to bypass RLS because the 
// Next.js API route handles the authentication logic.

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Securely stored in .env
);