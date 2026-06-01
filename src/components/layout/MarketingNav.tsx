"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { marketingNavItems } from "@/lib/navigation";

export function MarketingNav() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sky-200/40 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.svg"
            alt="LearnFlow"
            width={140}
            height={32}
            className="h-8 w-auto max-w-[120px] sm:max-w-none"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {marketingNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="marketing-btn-primary hidden rounded-xl px-4 py-2 text-sm font-semibold sm:inline-flex"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="marketing-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                Get started
              </Link>
            </>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/60 bg-white text-slate-700 shadow-sm md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          className="border-t border-sky-100 bg-white/95 px-4 py-4 backdrop-blur-md md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {marketingNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.title}
                </Link>
              </li>
            ))}
            {isLoggedIn ? (
              <li>
                <Link
                  href="/dashboard"
                  className="block rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-3 py-2.5 text-sm font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
