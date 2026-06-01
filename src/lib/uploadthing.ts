import { createUploadthing, type FileRouter } from "uploadthing/next";

import { auth } from "@/lib/auth";

const f = createUploadthing();

export const uploadRouter = {
  noteAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "1MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async () => {
      /* Client receives file.url from UploadThing response */
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
