import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth/authorization";
import { requireTenantContext } from "@/lib/auth/tenant-context";

export async function POST(req: Request) {
  try {
    const tenant = await requireTenantContext(req);
    authorize("read", "organization", tenant);
    return NextResponse.json({
      success: true,
      data: { message: "Invitation declined." },
    });
  } catch (err) {
    console.error("Decline Invite Error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
