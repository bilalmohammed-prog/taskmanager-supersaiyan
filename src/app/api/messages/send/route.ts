import { NextResponse } from "next/server";

export async function POST() {
  // Messaging is disabled for MVP. Keep response shape non-breaking.
  return NextResponse.json({ success: false, message: "Messaging is disabled for MVP." });
}
