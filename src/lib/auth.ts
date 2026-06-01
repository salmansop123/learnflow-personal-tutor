import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const providers: Provider[] = [
  Credentials({
    id: "session-token",
    name: "Email",
    credentials: {
      sessionToken: { label: "Session Token", type: "text" },
    },
    async authorize(credentials) {
      const sessionToken = credentials?.sessionToken as string | undefined;
      if (!sessionToken) return null;

      try {
        const res = await fetch(`${API_URL}/api/v1/auth/session/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken }),
        });

        if (!res.ok) {
          console.error(
            "[auth] session validate failed:",
            res.status,
            await res.text().catch(() => "")
          );
          return null;
        }

        const user = await res.json();
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          plan: user.plan ?? "FREE",
          onboardingComplete: user.onboardingComplete ?? false,
        };
      } catch (error) {
        console.error("[auth] session validate unreachable:", error);
        return null;
      }
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/oauth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name ?? profile?.name ?? null,
              image: user.image ?? null,
              provider: "google",
              providerAccountId: account.providerAccountId,
            }),
          });
          if (!res.ok) return false;
          const synced = await res.json();
          user.id = synced.id;
          (user as { plan?: string }).plan = synced.plan ?? "FREE";
          (user as { onboardingComplete?: boolean }).onboardingComplete =
            synced.onboardingComplete ?? false;
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string }).plan ?? "FREE";
        token.email = user.email ?? token.email;
        token.onboardingComplete =
          (user as { onboardingComplete?: boolean }).onboardingComplete ?? false;
      }
      if (trigger === "update" && session) {
        const data = session as {
          plan?: string;
          name?: string;
          onboardingComplete?: boolean;
        };
        if (data.plan) token.plan = data.plan;
        if (data.name) token.name = data.name;
        if (typeof data.onboardingComplete === "boolean") {
          token.onboardingComplete = data.onboardingComplete;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.plan = (token.plan as string) ?? "FREE";
        session.user.onboardingComplete =
          (token.onboardingComplete as boolean) ?? false;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
});
