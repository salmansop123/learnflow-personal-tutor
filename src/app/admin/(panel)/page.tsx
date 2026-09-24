"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminStats } from "@/types/admin";

const PLAN_COLORS: Record<string, string> = {
  FREE: "#94a3b8",
  PRO: "#2563eb",
  PREMIUM_PLUS: "#7c3aed",
  ENTERPRISE: "#d97706",
};

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function countryFlag(country: string): string {
  const map: Record<string, string> = {
    Pakistan: "🇵🇰",
    India: "🇮🇳",
    "United States": "🇺🇸",
    USA: "🇺🇸",
    UK: "🇬🇧",
    "United Kingdom": "🇬🇧",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    Germany: "🇩🇪",
    UAE: "🇦🇪",
    Bangladesh: "🇧🇩",
  };
  return map[country] ?? "🌍";
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/admin/api/stats");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        if (!cancelled) setStats(data as AdminStats);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load stats");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const paidPct = useMemo(() => {
    if (!stats || stats.totalUsers === 0) return 0;
    return Math.round((stats.paidUsers / stats.totalUsers) * 100);
  }, [stats]);

  const trend = useMemo(() => {
    if (!stats) return null;
    const prev = stats.usersLastMonth || 0;
    const curr = stats.newUsersThisMonth || 0;
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const pct = Math.round(((curr - prev) / prev) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}% vs last month`;
  }, [stats]);

  const dailySignups = useMemo(() => {
    if (!stats?.dailySignups?.length) return [];
    return stats.dailySignups.map((d) => ({
      date: d.date,
      count: Number(d.count) || 0,
    }));
  }, [stats]);

  const weeklySessions = useMemo(() => {
    if (!stats?.weeklyActiveSessions?.length) return [];
    return stats.weeklyActiveSessions.map((d) => ({
      week: d.week,
      count: Number(d.count) || 0,
    }));
  }, [stats]);

  const signupTotal = useMemo(
    () => dailySignups.reduce((sum, d) => sum + d.count, 0),
    [dailySignups]
  );
  const sessionTotal = useMemo(
    () => weeklySessions.reduce((sum, d) => sum + d.count, 0),
    [weeklySessions]
  );

  const pieData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.planDistribution)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value: Number(value) || 0 }));
  }, [stats]);

  const eduData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.educationLevelBreakdown)
      .filter(([k, v]) => k !== "UNKNOWN" && v > 0)
      .map(([name, count]) => ({ name, count: Number(count) || 0 }));
  }, [stats]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error ?? "No data"}
      </div>
    );
  }

  const maxCountry = Math.max(...stats.topCountries.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          subtitle={trend ?? undefined}
        />
        <StatCard
          title="Paid Users"
          value={stats.paidUsers.toLocaleString()}
          subtitle={`${paidPct}% of total`}
        />
        <StatCard
          title="Study Hours"
          value={stats.totalSessionHours.toLocaleString()}
          subtitle={`${stats.totalSessions} sessions`}
        />
        <StatCard
          title="Avg Quiz Score"
          value={`${stats.avgQuizScore}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Daily Signups (Last 30 Days)
            </h2>
            <span className="text-xs font-medium text-slate-600">
              {signupTotal} total
            </span>
          </div>
          <div className="h-64 w-full min-h-[256px]">
            {dailySignups.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-600">
                No signup data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailySignups}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#334155" }}
                    tickFormatter={(v: string) =>
                      typeof v === "string" && v.length >= 10 ? v.slice(5) : v
                    }
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#334155" }}
                    domain={[0, (max: number) => Math.max(4, max || 0)]}
                  />
                  <Tooltip
                    contentStyle={{ color: "#0f172a" }}
                    labelStyle={{ color: "#0f172a" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Signups"
                    stroke="#2563eb"
                    fill="url(#signupFill)"
                    strokeWidth={2}
                    dot={{ r: 2, fill: "#2563eb" }}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Weekly Study Sessions (Last 12 Weeks)
            </h2>
            <span className="text-xs font-medium text-slate-600">
              {sessionTotal} total
            </span>
          </div>
          <div className="h-64 w-full min-h-[256px]">
            {weeklySessions.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-600">
                No study session data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklySessions}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: "#334155" }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#334155" }}
                    domain={[0, (max: number) => Math.max(4, max || 0)]}
                  />
                  <Tooltip
                    contentStyle={{ color: "#0f172a" }}
                    labelStyle={{ color: "#0f172a" }}
                  />
                  <Bar
                    dataKey="count"
                    name="Sessions"
                    fill="#0C2340"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Plan Distribution
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name} ${Math.round((percent ?? 0) * 100)}%`
                  }
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PLAN_COLORS[entry.name] ?? "#64748b"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Top Countries
          </h2>
          <ul className="space-y-3">
            {stats.topCountries.slice(0, 8).map((c) => (
              <li key={c.country}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>
                    {countryFlag(c.country)} {c.country}
                  </span>
                  <span className="font-medium text-slate-700">{c.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(c.count / maxCountry) * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {stats.topCountries.length === 0 ? (
              <li className="text-sm text-slate-500">No country data yet</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Education Level
          </h2>
          <div className="h-56">
            {eduData.length === 0 ? (
              <p className="text-sm text-slate-500">No education data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eduData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Notes" value={stats.totalNotes} />
        <StatCard title="Notes with AI Summary" value={stats.notesWithSummary} />
        <StatCard title="Quizzes Taken" value={stats.totalQuizzes} />
        <StatCard title="Conversations" value={stats.totalConversations} />
      </div>
    </div>
  );
}
