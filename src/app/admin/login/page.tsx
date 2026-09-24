"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/admin/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid credentials");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel flex min-h-screen items-center justify-center bg-[#0C2340] px-4 text-slate-900">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <span className="absolute right-4 top-4 rounded bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Admin
        </span>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#0C2340]">LearnFlow Admin</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Restricted access — authorized personnel only
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-sm font-semibold text-slate-800"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#0C2340] focus:ring-2 focus:ring-[#0C2340]/20"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-semibold text-slate-800"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#0C2340] focus:ring-2 focus:ring-[#0C2340]/20"
            />
          </div>
          {error ? (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0C2340] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163a66] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
