import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { getApiUrl } from "@/lib/api";

const COOKIE_NAME = "learnflow_admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

/** Build admin credentials list from env vars (slots 1–10). */
export function getAdminCredentials(): Array<{ email: string; password: string }> {
  const admins: Array<{ email: string; password: string }> = [];
  for (let i = 1; i <= 10; i++) {
    const email = process.env[`ADMIN_EMAIL_${i}`];
    const password = process.env[`ADMIN_PASSWORD_${i}`];
    if (email && password && email.trim() !== "") {
      admins.push({ email: email.trim(), password: password.trim() });
    }
  }
  return admins;
}

export function validateAdminCredentials(
  email: string,
  password: string
): boolean {
  const admins = getAdminCredentials();
  return admins.some((a) => a.email === email && a.password === password);
}

export async function createAdminSession(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return { email: payload.email as string };
  } catch {
    return null;
  }
}

export async function verifyAdminToken(
  token: string
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return { email: payload.email as string };
  } catch {
    return null;
  }
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

/** Persist audit log via FastAPI (never throws). */
export async function logAdminAction(
  adminEmail: string,
  action: string,
  details?: {
    targetType?: string;
    targetId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    await fetch(getApiUrl("/admin/audit"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthSecret()}`,
      },
      body: JSON.stringify({
        adminEmail,
        action,
        targetType: details?.targetType,
        targetId: details?.targetId,
        details: details?.details,
        ipAddress: details?.ipAddress,
        userAgent: details?.userAgent,
      }),
    });
  } catch {
    /* never throw on audit log failure */
  }
}

/** Server-to-server fetch to FastAPI admin endpoints. */
export async function adminBackendFetch<T>(
  path: string,
  adminEmail: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthSecret()}`,
      "X-Admin-Email": adminEmail,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export function getRequestMeta(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return { ipAddress: ip, userAgent };
}

export function maskAdminEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export const ADMIN_COOKIE = { name: COOKIE_NAME, maxAge: COOKIE_MAX_AGE };
