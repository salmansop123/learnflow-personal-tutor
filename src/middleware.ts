import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const onboardingComplete = req.auth?.user?.onboardingComplete ?? false;
  const pathname = req.nextUrl.pathname;
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

  const isAuthPage =
    pathname === "/login" || pathname === "/register";

  if (isLoggedIn && isAuthPage && !accountMissing) {
    const dest = onboardingComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
