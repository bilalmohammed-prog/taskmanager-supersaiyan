import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  const employeeRouteMatch = pathname.match(/^\/organizations\/([^/]+)\/employees(?:\/.*)?$/);
  if (employeeRouteMatch) {
    const target = new URL(`/organizations/${employeeRouteMatch[1]}/team`, req.url);
    req.nextUrl.searchParams.forEach((value, key) => {
      target.searchParams.set(key, value);
    });
    return NextResponse.redirect(target);
  }

  const protectedPrefixes = [
    "/organizations",
    "/dashboard",
    "/projects",
    "/tasks",
    "/settings",
    "/onboarding",
  ];

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!user && isProtected) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/organizations/:path*",
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};