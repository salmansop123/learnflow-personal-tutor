import { NextResponse } from "next/server";
import { z } from "zod";

export function jsonError(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    return jsonError("Invalid request", 400, error.flatten());
  }

  if (error instanceof SyntaxError) {
    return jsonError("Invalid JSON in request body", 400);
  }

  const message =
    error instanceof Error ? error.message : "Something went wrong";

  if (message === "Unauthorized") {
    return jsonError("Unauthorized", 401);
  }

  if (message.includes("not configured")) {
    return jsonError(message, 503);
  }

  if (message.includes("not found") || message.includes("Not found")) {
    return jsonError(message, 404);
  }

  if (message.includes("Failed to parse quiz")) {
    return jsonError(message, 502);
  }

  console.error("[API]", error);
  return jsonError("Internal server error", 500);
}

export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new SyntaxError("Invalid JSON");
  }
  return schema.parse(raw);
}
