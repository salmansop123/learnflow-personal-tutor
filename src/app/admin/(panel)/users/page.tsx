"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eye, X } from "lucide-react";

import type {
  AdminUserDetail,
  AdminUserRow,
  AdminUsersResponse,
} from "@/types/admin";
import { cn } from "@/lib/utils";

const PLANS = ["FREE", "PRO", "PREMIUM_PLUS", "ENTERPRISE"] as const;

function planBadgeClass(plan: string) {
  switch (plan) {
    case "PRO":
      return "bg-blue-100 text-blue-800";
    case "PREMIUM_PLUS":
      return "bg-violet-100 text-violet-800";
    case "ENTERPRISE":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function initials(name: string | null, email: string) {
  const src = name?.trim() || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [plan, setPlan] = useState("ALL");
  const [sort, setSort] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        sort,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (plan !== "ALL") params.set("plan", plan);
      const res = await fetch(`/admin/api/users?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json as AdminUsersResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, sort, plan, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, plan, sort]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/admin/api/users/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load user");
      setDetail(json as AdminUserDetail);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const changePlan = async (userId: string, newPlan: string) => {
    if (!confirm(`Change plan to ${newPlan}?`)) return;
    const res = await fetch("/admin/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan: newPlan }),
    });
    if (res.ok) {
      void load();
      if (selectedId === userId) void openDetail(userId);
    } else {
      const json = await res.json();
      alert(json.error ?? "Failed to update plan");
    }
  };

  const exportCsv = () => {
    if (!data?.users.length) return;
    const headers = [
      "id",
      "name",
      "email",
      "plan",
      "country",
      "educationLevel",
      "createdAt",
      "onboardingComplete",
    ];
    const rows = data.users.map((u) =>
      [
        u.id,
        u.name ?? "",
        u.email,
        u.plan,
        u.country ?? "",
        u.educationLevel ?? "",
        u.createdAt ?? "",
        String(u.onboardingComplete),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnflow-users-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    void fetch("/admin/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: data.users.length }),
    });
  };

  const quizChart = useMemo(() => {
    if (!detail) return [];
    return detail.quizAttempts.slice(0, 5).reverse().map((q) => ({
      label: q.subject.slice(0, 8),
      score: q.score,
    }));
  }, [detail]);

  return (
    <div className="space-y-4 text-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-500"
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
        >
          <option value="ALL">All plans</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
        >
          <option value="createdAt_desc">Newest</option>
          <option value="createdAt_asc">Oldest</option>
          <option value="name_asc">Name A-Z</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-[#0C2340] px-4 py-2 text-sm font-medium text-white hover:bg-[#163a66]"
        >
          Export CSV
        </button>
      </div>

      {data ? (
        <p className="text-sm font-medium text-slate-800">
          Showing {data.users.length} of {data.total} users | FREE:{" "}
          {data.planCounts.FREE ?? 0} | PRO: {data.planCounts.PRO ?? 0} |
          PREMIUM+: {data.planCounts.PREMIUM_PLUS ?? 0} | ENTERPRISE:{" "}
          {data.planCounts.ENTERPRISE ?? 0}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-900">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-700">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Education</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Onboarding</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-medium text-slate-700">
                  Loading…
                </td>
              </tr>
            ) : data?.users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-medium text-slate-700">
                  No users found
                </td>
              </tr>
            ) : (
              data?.users.map((u: AdminUserRow) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0C2340] text-xs font-semibold text-white">
                        {initials(u.name, u.email)}
                      </span>
                      <span className="font-medium text-slate-900">
                        {u.name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        planBadgeClass(u.plan)
                      )}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{u.country ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{u.educationLevel ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {u.onboardingComplete ? (
                      <span className="text-emerald-700">Yes</span>
                    ) : (
                      <span className="text-amber-700">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="View user"
                        onClick={() => void openDetail(u.id)}
                        className="rounded p-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <select
                        value={u.plan}
                        onChange={(e) => void changePlan(u.id, e.target.value)}
                        className="rounded border border-slate-300 bg-white px-1.5 py-1 text-xs font-medium text-slate-900"
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border bg-white px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border bg-white px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {selectedId ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold text-slate-900">User detail</h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setDetail(null);
                }}
                className="rounded p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading || !detail ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-lg font-semibold">
                      {detail.user.name ?? detail.user.fullName ?? "—"}
                    </p>
                    <p className="text-sm text-slate-600">{detail.user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {detail.user.country ?? "—"} ·{" "}
                      {detail.user.preferredLanguage} ·{" "}
                      {detail.user.educationLevel ?? "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Study hours", detail.stats.totalStudyHours],
                      ["Notes", detail.stats.noteCount],
                      ["Quizzes", detail.stats.quizCount],
                      ["Sessions", detail.stats.studySessionCount],
                      ["Chats", detail.stats.conversationCount],
                      ["Reminders", detail.stats.reminderCount],
                    ].map(([label, val]) => (
                      <div
                        key={String(label)}
                        className="rounded-lg border bg-slate-50 p-3"
                      >
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-lg font-semibold">{val}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      Recent quiz scores
                    </h3>
                    <div className="h-40">
                      {quizChart.length === 0 ? (
                        <p className="text-sm text-slate-500">No quizzes</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={quizChart}>
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="score" fill="#2563eb" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      Recent sessions
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {detail.recentSessions.map((s) => (
                        <li
                          key={s.id}
                          className="flex justify-between rounded border px-3 py-2"
                        >
                          <span>{s.subject}</span>
                          <span className="text-slate-500">
                            {s.durationMins ?? 0} min
                          </span>
                        </li>
                      ))}
                      {detail.recentSessions.length === 0 ? (
                        <li className="text-slate-500">No sessions</li>
                      ) : null}
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Change plan</h3>
                    <div className="flex gap-2">
                      <select
                        id="detail-plan"
                        defaultValue={detail.user.plan}
                        className="flex-1 rounded border px-2 py-2 text-sm"
                        onChange={(e) => {
                          (
                            document.getElementById(
                              "detail-plan-save"
                            ) as HTMLButtonElement
                          ).dataset.plan = e.target.value;
                        }}
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <button
                        id="detail-plan-save"
                        type="button"
                        data-plan={detail.user.plan}
                        onClick={(e) => {
                          const planVal =
                            (e.currentTarget.dataset.plan as string) ||
                            detail.user.plan;
                          void changePlan(detail.user.id, planVal);
                        }}
                        className="rounded bg-[#0C2340] px-4 py-2 text-sm font-medium text-white"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">
                      Admin audit (this user)
                    </h3>
                    <ul className="space-y-2 text-xs">
                      {detail.auditTrail.map((a) => (
                        <li key={a.id} className="rounded border px-3 py-2">
                          <p className="font-medium">{a.action}</p>
                          <p className="text-slate-500">
                            {a.adminEmail} ·{" "}
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleString()
                              : ""}
                          </p>
                          {a.details ? (
                            <p className="mt-1 text-slate-600">{a.details}</p>
                          ) : null}
                        </li>
                      ))}
                      {detail.auditTrail.length === 0 ? (
                        <li className="text-slate-500">No admin actions yet</li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
