"use client";

import { getCountryName, resolveCountryCode } from "@/lib/country-education";
import {
  formatEducationArchetype,
  formatEducationTrack,
  formatLegacyEducationLevel,
  formatUniversityLevel,
} from "@/lib/education-display";
import {
  LANGUAGE_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  STUDY_TIME_OPTIONS,
} from "@/lib/profile-constants";
import { getProfileCompletionScore } from "@/lib/profile";
import { resolveLearningStyles, resolveStudyTimes } from "@/lib/profile-habits";
import type { StudentProfile } from "@/types/profile";

function ringColor(pct: number): string {
  if (pct >= 80) return "#22c55e";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

export function ProfileCard({ profile }: { profile: StudentProfile }) {
  const pct = getProfileCompletionScore(profile);
  const name = profile.fullName ?? profile.name ?? "Student";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const systemLabel =
    formatEducationArchetype(profile.educationArchetype) ??
    formatLegacyEducationLevel(profile.educationLevel);
  const levelLabel =
    profile.educationLevelLabel ??
    formatLegacyEducationLevel(profile.educationLevel);
  const trackLabel = formatEducationTrack(profile.educationTrack);
  const degreeLabel = formatUniversityLevel(profile.universityLevel);
  const countryLabel = profile.country
    ? getCountryName(resolveCountryCode(profile.country)) ||
      profile.country
    : null;
  const lang = LANGUAGE_OPTIONS.find((l) => l.id === profile.language);
  const styles = resolveLearningStyles(profile);
  const times = resolveStudyTimes(profile);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="rounded-xl border bg-card/80 p-6 shadow-soft backdrop-blur-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-2xl font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-2xl font-bold">{name}</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {countryLabel ? (
              <span className="rounded-full bg-slate-100 px-3 py-0.5 text-slate-700">
                {countryLabel}
              </span>
            ) : null}
            {lang ? (
              <span className="rounded-full bg-violet-100 px-3 py-0.5 text-violet-800">
                {lang.label}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <svg width="100" height="100" className="-rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={ringColor(pct)}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="-mt-[72px] text-center">
            <span className="text-xl font-bold">{pct}%</span>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>

      {pct < 100 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Complete your profile for better AI responses.
        </p>
      ) : null}

      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        {systemLabel || levelLabel ? (
          <div className="space-y-2 sm:col-span-2">
            {systemLabel ? (
              <div>
                <dt className="font-medium text-muted-foreground">
                  Education System
                </dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{systemLabel}</span>
                  {profile.educationArchetypeOverride ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Custom
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {levelLabel ? (
              <div>
                <dt className="font-medium text-muted-foreground">Level</dt>
                <dd className="mt-0.5">{levelLabel}</dd>
              </div>
            ) : null}
            {trackLabel ? (
              <div>
                <dt className="font-medium text-muted-foreground">Track</dt>
                <dd className="mt-0.5">{trackLabel}</dd>
              </div>
            ) : null}
            {profile.gradeOrYear ? (
              <div>
                <dt className="font-medium text-muted-foreground">
                  Year / Grade
                </dt>
                <dd className="mt-0.5">{profile.gradeOrYear}</dd>
              </div>
            ) : null}
            {degreeLabel ? (
              <div>
                <dt className="font-medium text-muted-foreground">
                  Degree Level
                </dt>
                <dd className="mt-0.5">{degreeLabel}</dd>
              </div>
            ) : null}
          </div>
        ) : null}
        {profile.subjectNames.length > 0 ? (
          <div>
            <dt className="font-medium text-muted-foreground">Subjects</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {profile.subjectNames.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs"
                >
                  {s}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        {profile.weakSubjects.length > 0 ? (
          <div>
            <dt className="font-medium text-muted-foreground">Needs focus</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {profile.weakSubjects.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"
                >
                  {s}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        {profile.strongSubjects.length > 0 ? (
          <div>
            <dt className="font-medium text-muted-foreground">Strong in</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {profile.strongSubjects.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800"
                >
                  {s}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        {styles.length > 0 ? (
          <div>
            <dt className="font-medium text-muted-foreground">Learning styles</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {styles.map((id) => {
                const opt = LEARNING_STYLE_OPTIONS.find((s) => s.id === id);
                return (
                  <span
                    key={id}
                    className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800"
                  >
                    {opt?.label ?? id}
                  </span>
                );
              })}
            </dd>
          </div>
        ) : null}
        {times.length > 0 ? (
          <div>
            <dt className="font-medium text-muted-foreground">Study times</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {times.map((id) => {
                const opt = STUDY_TIME_OPTIONS.find((s) => s.id === id);
                return (
                  <span
                    key={id}
                    className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800"
                  >
                    {opt?.label ?? id}
                  </span>
                );
              })}
            </dd>
          </div>
        ) : null}
        {profile.examType ? (
          <div className="sm:col-span-2">
            <dt className="font-medium text-muted-foreground">Exam prep</dt>
            <dd className="mt-1">
              {profile.examType}
              {profile.examPrepDetails ? ` — ${profile.examPrepDetails}` : ""}
            </dd>
          </div>
        ) : null}
        {profile.learningGoals ? (
          <div className="sm:col-span-2">
            <dt className="font-medium text-muted-foreground">Goals</dt>
            <dd className="mt-1">{profile.learningGoals}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
