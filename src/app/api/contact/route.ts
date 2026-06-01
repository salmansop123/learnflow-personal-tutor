import { z } from "zod";

import { handleRouteError } from "@/lib/api-route";
import { sendContactEmail } from "@/lib/email";

const bodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(5000),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    await sendContactEmail(body);
    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
