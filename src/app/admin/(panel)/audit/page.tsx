"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AdminAuditLog } from "@/types/admin";
import { cn } from "@/lib/utils";

const ACTION_OPTIONS = [
  "ALL",
  "USER_LOGIN",
  "USER_LOGOUT",
  "USER_REGISTER",
  "ADMIN_LOGIN",
  "ADMIN_LOGOUT",
  "VIEW_USER",
  "UPDATE_USER_PLAN",
  "USER_BAN",
  "VIEW_AUDIT_LOG",
  "EXPORT_USERS_CSV",
];

function actionColor(action: string) {
  if (action === "USER_LOGIN" || action === "USER_REGISTER") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (action === "USER_LOGOUT") {
    return "bg-orange-100 text-orange-800";
  }
  if (action.includes("LOGIN") || action.includes("LOGOUT")) {
    return "bg-blue-100 text-blue-800";
  }
  if (action.includes("BAN")) return "bg-red-100 text-red-800";
  if (action.includes("PLAN") || action.includes("UPDATE")) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (action.includes("VIEW")) return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-800";
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminEmail, setAdminEmail] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/admin/api/system")
      .then((r) => r.json())
      .then((sys) => {
        const emails = (sys.adminEmails ?? []) as string[];
        if (emails.length) setAdminEmails(emails);
        else if (sys.currentAdmin) setAdminEmails([sys.currentAdmin as string]);
      })
      .catch(() => {});
  }, []);

  const loggedView = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
      });
      if (adminEmail !== "ALL") params.set("adminEmail", adminEmail);
      if (action !== "ALL") params.set("action", action);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (!loggedView.current) {
        params.set("logView", "1");
        loggedView.current = true;
      }

      const res = await fetch(`/admin/api/audit?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setLogs(json.logs as AdminAuditLog[]);
      setTotal(json.total as number);
      setTotalPages(json.totalPages as number);

      const emails = Array.from(
        new Set((json.logs as AdminAuditLog[]).map((l) => l.adminEmail))
      );
      setAdminEmails((prev) => Array.from(new Set([...prev, ...emails])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, adminEmail, action, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const clearFilters = () => {
    setAdminEmail("ALL");
    setAction("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-4 text-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="text-sm text-slate-900">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            Actor
          </span>
          <select
            value={adminEmail}
            onChange={(e) => {
              setAdminEmail(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
          >
            <option value="ALL">All actors</option>
            {adminEmails.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-900">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            Action
          </span>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
          >
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-900">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            From
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-900">
          <span className="mb-1 block text-xs font-semibold text-slate-700">
            To
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
          />
        </label>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Clear filters
        </button>
      </div>

      <p className="text-xs font-medium text-slate-700">
        {total} entries · auto-refreshes every 60s
      </p>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-900">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-700">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor (user / admin)</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center font-medium text-slate-700"
                >
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center font-medium text-slate-700"
                >
                  No audit entries
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-800">
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {log.adminEmail}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        actionColor(log.action)
                      )}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-800">
                    {log.targetType ?? "—"}
                    {log.targetId ? (
                      <span className="ml-1 font-mono text-slate-700">
                        {log.targetId.slice(0, 8)}…
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-900">
                    {log.ipAddress ?? "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-2.5 font-medium text-slate-800">
                    {log.details ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-800">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
