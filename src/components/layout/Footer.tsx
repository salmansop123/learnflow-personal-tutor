import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="marketing-footer">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <Image
            src="/logo.svg"
            alt="LearnFlow"
            width={120}
            height={28}
            className="h-8 w-auto"
          />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
            AI-powered personal tutoring for students study smarter with
            color, clarity, and confidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium">
          <Link
            href="/#features"
            className="text-slate-600 transition-colors hover:text-sky-600"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-slate-600 transition-colors hover:text-sky-600"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            className="text-slate-600 transition-colors hover:text-sky-600"
          >
            Contact
          </Link>
          <Link
            href="/login"
            className="text-slate-600 transition-colors hover:text-sky-600"
          >
            Sign in
          </Link>
        </div>
        <p className="text-xs text-slate-500 sm:text-right">
          © {new Date().getFullYear()} LearnFlow. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
