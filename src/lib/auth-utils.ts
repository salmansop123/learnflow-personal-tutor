/** Read session token from FastAPI auth response (camelCase or snake_case). */
export function getSessionToken(data: {
  sessionToken?: string;
  session_token?: string;
}): string {
  const token = data.sessionToken ?? data.session_token;
  if (!token) {
    throw new Error("No session token returned from server");
  }
  return token;
}

export function parseApiError(
  data: unknown,
  fallback: string
): string {
  if (!data || typeof data !== "object") return fallback;
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) {
    return String(detail[0].msg);
  }
  return fallback;
}
