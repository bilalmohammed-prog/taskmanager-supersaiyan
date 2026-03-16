import { NextResponse } from "next/server";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export async function POST(req: Request) {
  try {
    await requireTenantContext(req);
    return NextResponse.json({
      success: true,
      data: { message: "Invitation declined." },
    });
  } catch (err) {
    console.error("Decline Invite Error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
