/**
 * Frontend HTTP client for the FastAPI backend.
 * All data mutations and reads go through this API — not Next.js API routes.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const API_PREFIX = "/api/v1";

export function getApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${API_PREFIX}${normalized}`;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl("/health"));
    return res.ok;
  } catch {
    return false;
  }
}
