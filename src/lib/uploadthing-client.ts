import { generateUploadButton } from "@uploadthing/react";

import type { UploadRouter } from "@/lib/uploadthing";

export const NoteUploadButton = generateUploadButton<UploadRouter>({
  url: "/api/upload",
});
