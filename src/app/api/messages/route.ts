import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Messaging is not yet supported in the current schema." },
    { status: 501 }
  );
}