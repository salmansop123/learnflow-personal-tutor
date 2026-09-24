import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE,
  createAdminSession,
  getAdminSession,
  getRequestMeta,
  logAdminAction,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!validateAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createAdminSession(email);
    const meta = getRequestMeta(request);
    await logAdminAction(email, "ADMIN_LOGIN", {
      details: "Admin logged in",
      ...meta,
    });

    const response = NextResponse.json({ success: true, email });
    response.cookies.set(ADMIN_COOKIE.name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_COOKIE.maxAge,
    });
    return response;
  } catch (error) {
    console.error("[admin/auth] login failed", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (session) {
    const meta = getRequestMeta(request);
    await logAdminAction(session.email, "ADMIN_LOGOUT", {
      details: "Admin logged out",
      ...meta,
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
