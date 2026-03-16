import { NextResponse } from "next/server";

export async function GET() {
  // Messaging is disabled for MVP. Return a stable empty payload for clients.
  return NextResponse.json([]);
}
