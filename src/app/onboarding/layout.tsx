import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2340] via-[#1a2744] to-[#1E1B4B]">
      <Link
        href="/"
        className="absolute left-4 top-4 z-10 text-lg font-bold text-white sm:left-8 sm:top-8"
      >
        LearnFlow
      </Link>
      <div className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
        {children}
      </div>
    </div>
  );
}
