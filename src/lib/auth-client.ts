import { signIn } from "next-auth/react";

import { API_UNREACHABLE_MESSAGE } from "@/lib/api-errors";

export async function signInWithBackendSession(
  sessionToken: string
): Promise<void> {
  const result = await signIn("session-token", {
    sessionToken,
    redirect: false,
  });

  if (result?.error) {
    throw new Error(
      `${result.error === "CredentialsSignin" ? "Session could not be verified. Ensure the backend is running (npm run dev:all) and try again." : "Could not start your session."} If this persists, register again or clear cookies for localhost.`
    );
  }

  if (result?.ok !== true) {
    throw new Error(API_UNREACHABLE_MESSAGE);
  }

  window.location.href = "/dashboard";
}
