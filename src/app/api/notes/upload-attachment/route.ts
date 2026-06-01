import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { auth } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-route";

const MAX_BYTES = 4 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = EXT_BY_TYPE[file.type];
    if (!ext) {
      return Response.json(
        { error: "Only PNG, JPG, GIF, or WebP images are supported" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: "Image must be smaller than 4MB" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const userDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "notes",
      session.user.id
    );
    await mkdir(userDir, { recursive: true });

    const filename = `${id}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(userDir, filename), bytes);

    const url = `/uploads/notes/${session.user.id}/${filename}`;
    return Response.json({ url, name: file.name });
  } catch (error) {
    return handleRouteError(error);
  }
}
