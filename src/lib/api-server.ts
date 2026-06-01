import { getApiUrl } from "@/lib/api";

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export function getServerApiHeaders(userId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthSecret()}`,
    "X-User-Id": userId,
  };
}

function parseErrorPayload(
  text: string,
  status: number
): { message: string; details?: unknown } {
  try {
    const data = JSON.parse(text) as {
      detail?: string | { msg?: string }[];
      error?: string;
      message?: string;
    };
    if (typeof data.detail === "string") {
      return { message: data.detail };
    }
    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      return { message: data.detail[0].msg, details: data.detail };
    }
    if (data.error) return { message: data.error, details: data };
    if (data.message) return { message: data.message };
  } catch {
    /* plain text */
  }
  if (text.length > 0 && text.length < 200) {
    return { message: text };
  }
  return { message: `Request failed (${status})` };
}

export async function serverApiFetch<T>(
  path: string,
  userId: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      ...getServerApiHeaders(userId),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    const { message, details } = parseErrorPayload(text, res.status);
    throw new ApiRequestError(message, res.status, details);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
