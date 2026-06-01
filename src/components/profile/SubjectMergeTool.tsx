"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GitMerge } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  findDuplicateSubjectGroups,
  normalizeSubjectName,
} from "@/lib/subject-normalizer";
import { toast, toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { SubjectTotalStats } from "@/types/study";

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MergeCard({
  subjects,
  profileSubjects,
  onMerged,
}: {
  subjects: string[];
  profileSubjects: string[];
  onMerged: () => void;
}) {
  const defaultInto = normalizeSubjectName(subjects[0] ?? "", profileSubjects);
  const [into, setInto] = useState(defaultInto);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setInto(normalizeSubjectName(subjects[0] ?? "", profileSubjects));
  }, [subjects, profileSubjects]);

  const fromList = subjects.filter(
    (s) => s.toLowerCase() !== into.trim().toLowerCase()
  );

  async function handleMerge() {
    const target = into.trim();
    if (!target || fromList.length === 0) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/study/subjects/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromList, into: target }),
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to merge subjects");
      }
      toast.success(data.message ?? "Subjects merged successfully");
      onMerged();
    } catch (err) {
      toastError(err, "Failed to merge subjects");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {subjects.map((name, index) => (
          <span key={name} className="flex items-center gap-2">
            {index > 0 ? (
              <span className="text-muted-foreground">+</span>
            ) : null}
            <span className="rounded-full bg-white px-2.5 py-0.5 font-medium shadow-sm dark:bg-slate-800">
              {name}
            </span>
          </span>
        ))}
        <span className="text-muted-foreground">→</span>
        <span className="text-xs text-muted-foreground">Merge into:</span>
        <Input
          value={into}
          onChange={(e) => setInto(e.target.value)}
          list={`merge-into-${subjects.join("-")}`}
          className="h-8 max-w-[200px] bg-white dark:bg-card"
          disabled={isPending}
        />
        <datalist id={`merge-into-${subjects.join("-")}`}>
          {subjects.map((s) => (
            <option key={s} value={normalizeSubjectName(s, profileSubjects)} />
          ))}
        </datalist>
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        disabled={isPending || fromList.length === 0}
        onClick={handleMerge}
      >
        {isPending ? "Merging…" : "Merge"}
      </Button>
    </div>
  );
}

export function SubjectMergeTool({
  profileSubjects,
}: {
  profileSubjects: string[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<SubjectTotalStats[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study/stats");
      if (!res.ok) throw new Error("Failed to load session stats");
      const data = (await res.json()) as SubjectTotalStats[];
      setStats(data);
    } catch (err) {
      toastError(err, "Could not load session history");
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash === "#subject-merge-tool"
    ) {
      setExpanded(true);
    }
  }, []);

  useEffect(() => {
    if (expanded && stats.length === 0 && !loading) {
      void loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const historySubjects = useMemo(() => {
    const names = stats
      .filter((s) => s.totalMinutes > 0)
      .map((s) => s.subject);
    const profileOnly = profileSubjects.filter(
      (p) => !names.some((n) => n.toLowerCase() === p.toLowerCase())
    );
    return [...names, ...profileOnly];
  }, [stats, profileSubjects]);

  const duplicateGroups = useMemo(
    () => findDuplicateSubjectGroups(historySubjects),
    [historySubjects]
  );

  const duplicateSubjectSet = useMemo(() => {
    const set = new Set<string>();
    for (const group of duplicateGroups) {
      for (const name of group) set.add(name.toLowerCase());
    }
    return set;
  }, [duplicateGroups]);

  function handleMerged() {
    void loadStats();
    router.refresh();
  }

  return (
    <section
      id="subject-merge-tool"
      className="scroll-mt-24 rounded-xl border border-blue-100 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-3 bg-[#EFF6FF] px-4 py-3 text-left transition-colors hover:bg-blue-100/80 dark:bg-blue-950/30"
        )}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <GitMerge className="h-5 w-5 text-blue-600" aria-hidden />
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Subject Merge Tool
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {expanded ? "Collapse" : "Expand"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-blue-100 p-4 dark:border-blue-900">
              <p className="text-sm text-muted-foreground">
                Combine subjects from your session history so your pie chart
                shows one name for related topics (e.g. Maths + Mathematics).
              </p>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading stats…</p>
              ) : stats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No logged study time yet. Complete a session and log your
                  time breakdown to use the merge tool.
                </p>
              ) : (
                <>
                  <div>
                    <h4 className="text-sm font-medium">
                      Subjects found in your session history
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {stats
                        .filter((s) => s.totalMinutes > 0)
                        .map((entry) => {
                          const isDuplicate = duplicateSubjectSet.has(
                            entry.subject.toLowerCase()
                          );
                          return (
                            <li
                              key={entry.subject}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">
                                  {entry.subject}
                                </span>
                                {isDuplicate ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                    Possible duplicate detected
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-muted-foreground tabular-nums">
                                {formatMinutes(entry.totalMinutes)}
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  {duplicateGroups.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        Suggested merges
                      </h4>
                      {duplicateGroups.map((group) => (
                        <MergeCard
                          key={group.join("|")}
                          subjects={group}
                          profileSubjects={profileSubjects}
                          onMerged={handleMerged}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No automatic duplicate pairs detected. You can still
                      merge manually by editing subject names in your profile
                      list above.
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
