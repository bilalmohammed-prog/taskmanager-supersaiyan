"use server";

import { cookies } from "next/headers";

export async function switchOrganization(orgId: string) {
  const cookieStore = await cookies();

  cookieStore.set("activeOrg", orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}
