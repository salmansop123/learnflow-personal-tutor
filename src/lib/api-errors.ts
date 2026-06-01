/** User-facing message when the FastAPI backend is unreachable. */
export const API_UNREACHABLE_MESSAGE =
  "Cannot reach the LearnFlow API. Start the full stack with: npm run dev:all (frontend + backend on port 8000).";

export function isNetworkFetchError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("failed to fetch")
  );
}

export function formatClientFetchError(
  err: unknown,
  fallback = "Something went wrong"
): string {
  if (isNetworkFetchError(err)) return API_UNREACHABLE_MESSAGE;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** True when a server-side fetch to the FastAPI backend failed (e.g. ECONNREFUSED). */
export function isApiUnreachableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.message.includes("fetch failed")) return true;
  const cause = err.cause as { code?: string } | undefined;
  return cause?.code === "ECONNREFUSED";
}
