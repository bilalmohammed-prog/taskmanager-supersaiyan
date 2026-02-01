import { supabase } from "@/lib/supabaseClient";

export async function insertMessage({
  receiverEmail,
  subject,
  body,
  type,
  managerId,
}: {
  receiverEmail: string;
  subject: string;
  body: string;
  type: "message" | "invite";
  managerId?: string;
}) {
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user?.email) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("messages").insert({
    sender_email: auth.user.email,
    receiver_email: receiverEmail,
    subject,
    body,
    type,
    status: type === "invite" ? "pending" : "read",
    manager_id: managerId ?? null,
  });

  if (error) {
    console.error("Insert message failed:", error.message);
    throw error;
  }
}
