import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel hover-lift relative z-10 w-full max-w-md space-y-6 rounded-2xl p-8">
        <div className="space-y-2 text-center">
          <Link href="/" className="gradient-text-brand text-xl font-bold tracking-tight">
            LearnFlow
          </Link>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
        {footer && (
          <div className="text-center text-sm text-muted-foreground">{footer}</div>
        )}
      </div>
    </main>
  );
}
