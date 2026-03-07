import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (meError || !me?.active_organization_id) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const organizationId = me.active_organization_id;

  const { data, error } = await supabase
    .from("org_members")
    .select(
      `
        user_id,
        profiles!org_members_user_id_fkey (
          id,
          full_name,
          username
        )
      `
    )
    .eq("organization_id", organizationId)
    .eq("profiles.username", email)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const profile = data
    ? Array.isArray(data.profiles)
      ? data.profiles[0]
      : data.profiles
    : null;

  if (!data || !profile) {
    return NextResponse.json({ empID: null }, { status: 200 });
  }

  return NextResponse.json({
    empID: data.user_id,
    name: profile.full_name ?? null,
  });
}