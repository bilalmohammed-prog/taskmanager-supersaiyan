import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    /* 1️⃣ AUTH */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ employees: [] });
    }

    /* 2️⃣ QUERY EMPLOYEES */
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, user_id, emp_id")
      .eq("manager_id", user.id);

    if (error) {
      console.error(error);
      return NextResponse.json({ employees: [] });
    }

    /* 3️⃣ FORMAT */
    const employees =
      data?.map((e) => ({
        id: e.id,
        name: e.name,
        user_id: e.user_id,
        emp_id: e.emp_id,
      })) ?? [];

    return NextResponse.json({ employees });

  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json({ employees: [] });
  }
}
