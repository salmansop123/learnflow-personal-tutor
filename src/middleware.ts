import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Admin route protection (separate from user Auth.js)
  if (pathname.startsWith("/admin")) {
    if (
      pathname === "/admin/login" ||
      pathname.startsWith("/admin/api/")
    ) {
      return NextResponse.next();
    }
    const adminToken = req.cookies.get("learnflow_admin_token")?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    // Full JWT verification happens in route handlers / layout
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const onboardingComplete = req.auth?.user?.onboardingComplete ?? false;
  const accountMissing =
    req.nextUrl.searchParams.get("reason") === "account_missing";

  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname.startsWith("/onboarding");

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isDashboard && !onboardingComplete) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (isLoggedIn && isOnboarding && onboardingComplete) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isLoggedIn && isAuthPage && !accountMissing) {
    const dest = onboardingComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
