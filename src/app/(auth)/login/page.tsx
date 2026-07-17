import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { ClearStaleSession } from "@/components/auth/ClearStaleSession";
import { LoginForm } from "@/components/auth/LoginForm";

type PageProps = {
  searchParams?: { reason?: string };
};

export default function LoginPage({ searchParams }: PageProps) {
  const showGoogle = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );
  const accountMissing = searchParams?.reason === "account_missing";

  return (
    <AuthCard
      title="Sign in"
      subtitle="Sign in with your email and password"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground underline">
            Register
          </Link>
        </>
      }
    >
      {accountMissing ? (
        <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          Your previous account is not in the database (for example after a reset).
          Register again, then sign in with your new account.
        </p>
      ) : null}
      <ClearStaleSession active={accountMissing} />
      <LoginForm showGoogle={showGoogle} />
    </AuthCard>
  );
}
