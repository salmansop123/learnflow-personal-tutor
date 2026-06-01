import { auth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-route";
import { isAllowedDocument } from "@/lib/document-constants";
import { extractTextFromFile } from "@/lib/document-extract-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No file provided", 400);
    }

    if (!isAllowedDocument(file)) {
      return jsonError("Unsupported file type", 400);
    }

    const { text, extension } = await extractTextFromFile(file);

    return Response.json({
      name: file.name,
      text,
      extension,
      charCount: text.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
