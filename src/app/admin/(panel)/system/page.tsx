"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminSystemHealth } from "@/types/admin";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days} days ${hours} hours ${mins} min`;
}

export default function AdminSystemPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminSystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStarted] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/admin/api/system");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (!cancelled) setData(json as AdminSystemHealth);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const countdown = useMemo(() => {
    void tick;
    const remaining = 8 * 60 * 60 * 1000 - (Date.now() - sessionStarted);
    return formatUptime(Math.max(0, remaining) / 1000);
  }, [sessionStarted, tick]);

  const logout = async () => {
    await fetch("/admin/api/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-200" />;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error ?? "No data"}
      </div>
    );
  }

  const dbOk = data.dbStatus === "healthy";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          System health
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                dbOk ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span>
              Database: {dbOk ? "Connected" : "Error"}
            </span>
          </div>
          <div>
            <p className="mb-2 font-medium text-slate-700">Environment</p>
            <ul className="space-y-1">
              {Object.entries(data.envVarsPresent).map(([key, present]) => (
                <li key={key} className="flex justify-between text-slate-600">
                  <span>{key}</span>
                  <span className={present ? "text-emerald-600" : "text-red-600"}>
                    {present ? "Present ✓" : "Missing ✗"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-slate-600">Node: {data.nodeVersion}</p>
          <p className="text-slate-600">
            Uptime: {formatUptime(data.uptime)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Admin accounts
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          {data.adminCount} active · To add admins, update environment variables
          and redeploy. Passwords are never shown.
        </p>
        <ul className="space-y-2 text-sm">
          {data.adminSlots.map((slot) => (
            <li
              key={slot.slot}
              className="flex items-center justify-between rounded border px-3 py-2"
            >
              <span>
                Slot {slot.slot}:{" "}
                {slot.email ?? (
                  <span className="text-slate-400">empty</span>
                )}
              </span>
              <span
                className={
                  slot.status === "Active"
                    ? "text-emerald-600"
                    : "text-slate-400"
                }
              >
                {slot.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Quick stats
        </h2>
        <ul className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(data.tableCounts).map(([table, count]) => (
            <li key={table} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">{table}</p>
              <p className="text-xl font-bold">{count.toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Session info
        </h2>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Currently logged in as:{" "}
            <strong>{data.currentAdmin}</strong>
          </p>
          <p>Session expires in: {countdown}</p>
          <p className="text-xs text-slate-500">
            Sessions last 8 hours from login (approx. remaining shown).
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
