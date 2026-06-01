/** UploadThing v7 expects UPLOADTHING_TOKEN; support legacy SECRET + APP_ID too. */
export function getUploadthingToken(): string | undefined {
  if (process.env.UPLOADTHING_TOKEN) {
    return process.env.UPLOADTHING_TOKEN;
  }

  const secret = process.env.UPLOADTHING_SECRET;
  const appId = process.env.UPLOADTHING_APP_ID;
  if (!secret || !appId) return undefined;

  const payload = JSON.stringify({
    apiKey: secret,
    appId,
    regions: ["sea1"],
  });

  return Buffer.from(payload, "utf-8").toString("base64");
}
