import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const showGoogle = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

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
      <LoginForm showGoogle={showGoogle} />
    </AuthCard>
  );
}
