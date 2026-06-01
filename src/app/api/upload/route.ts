import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "@/lib/uploadthing";
import { getUploadthingToken } from "@/lib/uploadthing-token";

const token = getUploadthingToken();

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: token ? { token } : undefined,
});
