"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AdminContentOverview } from "@/types/admin";

export default function AdminContentPage() {
  const [data, setData] = useState<AdminContentOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/admin/api/content");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (!cancelled) setData(json as AdminContentOverview);
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

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Notes overview</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Total notes</p>
            <p className="mt-1 text-2xl font-bold">{data.totalNotes}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">With AI summary</p>
            <p className="mt-1 text-2xl font-bold">{data.notesWithSummary}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Avg note length</p>
            <p className="mt-1 text-2xl font-bold">
              {data.averageNoteLength.toLocaleString()} chars
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.recentNotes.map((n) => (
                <tr key={n.id} className="border-b last:border-0">
                  <td className="max-w-[200px] truncate px-4 py-2 font-medium">
                    {n.title}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{n.userEmail}</td>
                  <td className="px-4 py-2">{n.subject ?? "—"}</td>
                  <td className="px-4 py-2">
                    {n.hasSummary ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        Yes
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Quiz overview</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Total attempts</p>
            <p className="mt-1 text-2xl font-bold">{data.totalQuizAttempts}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-500">Average score</p>
            <p className="mt-1 text-2xl font-bold">{data.averageScore}%</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Top quizzed subjects</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSubjects}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0C2340" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">
              Avg scores (last 30 days)
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scoresOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentQuizzes.map((q) => (
                <tr key={q.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{q.subject}</td>
                  <td className="px-4 py-2">{q.topic ?? "—"}</td>
                  <td className="px-4 py-2">{q.score}%</td>
                  <td className="px-4 py-2">{q.difficulty}</td>
                  <td className="px-4 py-2 text-slate-600">{q.userEmail}</td>
                  <td className="px-4 py-2">
                    {q.createdAt
                      ? new Date(q.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
