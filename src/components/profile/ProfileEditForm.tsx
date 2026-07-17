"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileChangesConfirmModal } from "@/components/profile/ProfileChangesConfirmModal";
import { Step2Education } from "@/components/profile/steps/Step2Education";
import { SelectionGrid } from "@/components/profile/SelectionGrid";
import { SubjectMergeTool } from "@/components/profile/SubjectMergeTool";
import { SubjectPillInput } from "@/components/profile/SubjectPillInput";
import { getCountryOptions } from "@/lib/country-education";
import { formatEducationArchetype } from "@/lib/education-display";
import {
  EDUCATION_SYSTEMS,
  type EducationArchetype,
} from "@/lib/education-systems";
import {
  LANGUAGE_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  needsExamStep,
  STUDY_TIME_OPTIONS,
} from "@/lib/profile-constants";
import {
  applySnapshotToForm,
  computePendingChanges,
  pendingChangesToPatch,
  snapshotProfileForm,
  type ProfileValidationResult,
} from "@/lib/profile-change-utils";
import { resetProfileClient, updateProfileClient, fetchProfileClient } from "@/lib/profile";
import {
  detectPossibleTypo,
  looksLikeSubjectName,
  normalizeSubjectName,
} from "@/lib/subject-normalizer";
import { toast, toastError } from "@/lib/toast";
import type {
  LearningStyle,
  OnboardingFormData,
  ProfileUpdateInput,
  StudentProfile,
  StudyTime,
} from "@/types/profile";
import { resolveLearningStyles, resolveStudyTimes } from "@/lib/profile-habits";

export function ProfileEditForm({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const { update } = useSession();
  const [form, setForm] = useState<StudentProfile & OnboardingFormData>(() => ({
    ...profile,
    fullName: profile.fullName ?? profile.name ?? "",
    learningStyles: resolveLearningStyles(profile),
    preferredStudyTimes: resolveStudyTimes(profile),
    educationArchetype: profile.educationArchetype ?? "GENERIC",
    educationTier: profile.educationTier ?? "UPPER_SECONDARY",
    educationLevelLabel: profile.educationLevelLabel ?? "",
    educationTrack: profile.educationTrack ?? null,
    educationArchetypeOverride: profile.educationArchetypeOverride ?? false,
    educationLevelId: "",
    educationLevel: profile.educationLevel ?? "SCHOOL",
    gradeOrYear: profile.gradeOrYear ?? "",
  }) as StudentProfile & OnboardingFormData);
  const countries = getCountryOptions();
  const educationSectionRef = useRef<HTMLElement>(null);
  const [showSystemPicker, setShowSystemPicker] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [originalValues, setOriginalValues] = useState<Record<string, unknown>>(
    () => snapshotProfileForm(form)
  );
  const [showConfirmCard, setShowConfirmCard] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ProfileValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [typoBanner, setTypoBanner] = useState<{
    original: string;
    suggestion: string;
  } | null>(null);
  const [subjectInlineError, setSubjectInlineError] = useState<string | null>(
    null
  );
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);
  const subjectSaveVersion = useRef(0);

  const currentSnapshot = useMemo(() => snapshotProfileForm(form), [form]);
  const pendingChanges = useMemo(
    () => computePendingChanges(currentSnapshot, originalValues),
    [currentSnapshot, originalValues]
  );
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  useEffect(() => {
    if (!hasPendingChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasPendingChanges]);

  const ARCHETYPE_ORDER: EducationArchetype[] = [
    "SOUTH_ASIAN",
    "INDIAN",
    "BRITISH",
    "NORTH_AMERICAN",
    "EUROPEAN_CONTINENTAL",
    "EAST_ASIAN",
    "GENERIC",
  ];

  const systemDisplayName =
    formatEducationArchetype(form.educationArchetype) ?? "General System";

  function openSystemPicker() {
    setShowSystemPicker(true);
    educationSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleArchetypeChange(archetype: EducationArchetype) {
    setForm((prev) => ({
      ...prev,
      educationArchetype: archetype,
      educationArchetypeOverride: true,
      educationLevelLabel: "",
      educationTier: "",
      educationTrack: null,
      educationLevelId: "",
      universityLevel: null,
    }));
    setShowSystemPicker(false);
    try {
      const archetypePatch = {
        educationArchetype: archetype,
        educationArchetypeOverride: true,
        educationLevelLabel: "",
        educationTier: "",
        educationTrack: null,
      };
      await updateProfileClient(archetypePatch);
      setOriginalValues((prev) => ({
        ...prev,
        ...archetypePatch,
      }));
      toast.success("Education system updated — re-select your level below.");
    } catch (err) {
      toastError(err, "Failed to update education system");
    }
  }

  function patch<K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function persistSubjectNames(nextSubjects: string[]) {
    const version = ++subjectSaveVersion.current;
    setIsSavingSubjects(true);
    try {
      const updated = await updateProfileClient({ subjectNames: nextSubjects });
      if (version !== subjectSaveVersion.current) return;
      const saved = updated.subjectNames ?? nextSubjects;
      setForm((prev) => ({ ...prev, subjectNames: saved }));
      setOriginalValues((prev) => ({ ...prev, subjectNames: saved }));
      router.refresh();
    } catch (err) {
      if (version !== subjectSaveVersion.current) return;
      toastError(err, "Failed to save subjects");
      try {
        const profile = await fetchProfileClient();
        const savedSubjects = profile.subjectNames ?? [];
        setForm((prev) => ({ ...prev, subjectNames: savedSubjects }));
        setOriginalValues((prev) => ({ ...prev, subjectNames: savedSubjects }));
      } catch {
        /* keep local state if refetch fails */
      }
    } finally {
      if (version === subjectSaveVersion.current) {
        setIsSavingSubjects(false);
      }
    }
  }

  function addSubjectPill(name: string) {
    setTypoBanner(null);
    setSubjectInlineError(null);
    const exists = form.subjectNames.some(
      (s) => s.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      const nextSubjects = [...form.subjectNames, name];
      patch("subjectNames", nextSubjects);
      void persistSubjectNames(nextSubjects);
    }
  }

  function handleSubjectAdd(rawInput: string) {
    setSubjectInlineError(null);
    const suggestions = form.subjectNames;
    const typo = detectPossibleTypo(rawInput, suggestions);
    if (typo !== null) {
      const suggestion = normalizeSubjectName(rawInput, suggestions);
      setTypoBanner({ original: rawInput, suggestion });
      return;
    }
    if (!looksLikeSubjectName(rawInput)) {
      setSubjectInlineError(
        "This doesn't look like a subject name. Please enter a real subject."
      );
      return;
    }
    addSubjectPill(normalizeSubjectName(rawInput, suggestions));
  }

  async function runValidationFlow() {
    if (!hasPendingChanges) {
      toast.info("No changes to save.");
      return;
    }
    setIsValidating(true);
    try {
      const res = await fetch("/api/profile/validate-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: pendingChanges }),
      });
      const data = (await res.json()) as ProfileValidationResult & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Validation failed");
      }
      setValidationResult(data);
      setShowConfirmCard(true);
    } catch (err) {
      toastError(err, "Could not validate profile changes");
    } finally {
      setIsValidating(false);
    }
  }

  function handleSaveClick(e: React.FormEvent) {
    e.preventDefault();
    void runValidationFlow();
  }

  function handleConfirmSave() {
    setShowConfirmCard(false);
    startTransition(async () => {
      try {
        const updated = await updateProfileClient(
          pendingChangesToPatch(pendingChanges) as ProfileUpdateInput
        );
        const merged = {
          ...profile,
          ...updated,
          fullName: updated.fullName ?? updated.name ?? profile.fullName ?? "",
          learningStyles: resolveLearningStyles(updated),
          preferredStudyTimes: resolveStudyTimes(updated),
        } as StudentProfile & OnboardingFormData;
        const nextForm = applySnapshotToForm(merged, snapshotProfileForm(merged));
        setForm(nextForm);
        setOriginalValues(snapshotProfileForm(nextForm));
        setValidationResult(null);
        toast.success("Profile updated successfully");
        router.refresh();
      } catch (err) {
        toastError(err, "Failed to save profile");
      }
    });
  }

  function handleDiscard() {
    setForm(applySnapshotToForm(profile, originalValues));
    setTypoBanner(null);
    setSubjectInlineError(null);
    setShowConfirmCard(false);
    setValidationResult(null);
  }

  function handleReset() {
    startTransition(async () => {
      try {
        await resetProfileClient();
        await update({ onboardingComplete: false });
        router.push("/onboarding");
      } catch (err) {
        toastError(err, "Failed to reset profile");
      }
    });
  }

  return (
    <form onSubmit={handleSaveClick} className="space-y-6">
      {hasPendingChanges ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <span>You have unsaved changes.</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void runValidationFlow()}
              disabled={isPending || isValidating}
            >
              {isValidating ? "Checking…" : "Save changes"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
              disabled={isPending || isValidating}
            >
              Discard
            </Button>
          </div>
        </div>
      ) : null}

      <section className="rounded-xl border p-4 space-y-4">
        <h3 className="font-semibold">Personal info</h3>
        <div className="space-y-2">
          <Label htmlFor="edit-fullName">Full name</Label>
          <Input
            id="edit-fullName"
            value={form.fullName ?? ""}
            onChange={(e) => patch("fullName", e.target.value)}
            className="bg-white dark:bg-card/80"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-age">Age</Label>
            <Input
              id="edit-age"
              type="number"
              value={form.age ?? ""}
              onChange={(e) =>
                patch("age", e.target.value ? Number(e.target.value) : null)
              }
              className="bg-white dark:bg-card/80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-country">Country</Label>
            <select
              id="edit-country"
              value={form.country ?? ""}
              onChange={(e) => patch("country", e.target.value || null)}
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm dark:bg-card/80"
            >
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <SelectionGrid
            options={LANGUAGE_OPTIONS.map((l) => ({ id: l.id, label: l.label }))}
            value={form.language}
            onChange={(v) => patch("language", v as string)}
          />
        </div>
      </section>

      <section
        ref={educationSectionRef}
        id="education-section"
        className="rounded-xl border p-4 space-y-4"
      >
        <h3 className="font-semibold">Education</h3>
        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Current education system:{" "}
            <span className="font-medium text-foreground">{systemDisplayName}</span>
            {form.educationArchetypeOverride ? (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                Custom
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={openSystemPicker}
            className="text-left text-sm font-medium text-blue-600 hover:text-blue-800 sm:text-right"
          >
            Change system →
          </button>
        </div>
        {showSystemPicker ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ARCHETYPE_ORDER.map((arch) => {
              const sys = EDUCATION_SYSTEMS[arch];
              const selected = form.educationArchetype === arch;
              return (
                <button
                  key={arch}
                  type="button"
                  disabled={isPending}
                  onClick={() => void handleArchetypeChange(arch)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? "border-blue-500 bg-[#EFF6FF]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="block font-semibold text-slate-900">
                    {sys.displayName}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {sys.description}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        <Step2Education
          formData={form}
          onChange={(field, value) =>
            setForm((prev) => ({ ...prev, [field]: value }))
          }
          errors={{}}
        />
      </section>

      <section className="rounded-xl border p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Subjects</h3>
          {isSavingSubjects ? (
            <span className="text-xs text-muted-foreground">Saving…</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Subjects save automatically
            </span>
          )}
        </div>
        <SubjectPillInput
          value={form.subjectNames}
          onChange={(v) => {
            patch("subjectNames", v);
            setSubjectInlineError(null);
            void persistSubjectNames(v);
          }}
          suggestionSubjects={form.subjectNames}
          onRequestAddSubject={handleSubjectAdd}
          disabled={isSavingSubjects}
          afterInput={
            <>
              {subjectInlineError ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {subjectInlineError}
                </p>
              ) : null}
              {typoBanner ? (
                <div className="rounded-lg border border-amber-500 bg-[#FFFBEB] px-3 py-3 dark:bg-amber-950/30">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    Did you mean{" "}
                    <strong>&apos;{typoBanner.suggestion}&apos;</strong>?
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-amber-500 text-white hover:bg-amber-600"
                      onClick={() => addSubjectPill(typoBanner.suggestion)}
                    >
                      Yes, use &apos;{typoBanner.suggestion}&apos;
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addSubjectPill(typoBanner.original)}
                    >
                      No, keep &apos;{typoBanner.original}&apos;
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          }
        />
        <SubjectMergeTool profileSubjects={form.subjectNames} />
      </section>

      <section className="rounded-xl border p-4 space-y-4">
        <h3 className="font-semibold">Study habits</h3>
        <p className="text-sm text-muted-foreground">
          Choose all options that fit you — learning style and preferred study
          times.
        </p>
        <SelectionGrid
          options={LEARNING_STYLE_OPTIONS}
          value={resolveLearningStyles(form)}
          onChange={(v) => patch("learningStyles", v as LearningStyle[])}
          multi
        />
        <SelectionGrid
          options={STUDY_TIME_OPTIONS}
          value={resolveStudyTimes(form)}
          onChange={(v) => patch("preferredStudyTimes", v as StudyTime[])}
          multi
        />
        <textarea
          value={form.learningGoals ?? ""}
          onChange={(e) => patch("learningGoals", e.target.value || null)}
          rows={3}
          placeholder="Learning goals"
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-card/80"
        />
      </section>

      {needsExamStep(form.educationLevel ?? "", form.educationTier) ? (
        <section className="rounded-xl border p-4 space-y-4">
          <h3 className="font-semibold">Exam preparation (optional)</h3>
          <Input
            value={form.examType ?? ""}
            onChange={(e) => patch("examType", e.target.value || null)}
            placeholder="Exam type (optional)"
            className="bg-white dark:bg-card/80"
          />
          <textarea
            value={form.examPrepDetails ?? ""}
            onChange={(e) => patch("examPrepDetails", e.target.value || null)}
            rows={3}
            placeholder="Exam details"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-card/80"
          />
        </section>
      ) : null}

      <div className="sticky bottom-0 flex flex-col gap-3 border-t bg-background/95 py-4 sm:flex-row sm:justify-between">
        <Button type="submit" disabled={isPending || isValidating}>
          {isValidating ? "Checking changes…" : isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-muted-foreground"
          onClick={() => setResetOpen(true)}
        >
          Reset profile
        </Button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset profile?"
        description="This clears your profile and sends you back through onboarding."
        confirmLabel="Reset"
        variant="destructive"
        isLoading={isPending}
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />

      <ProfileChangesConfirmModal
        open={showConfirmCard}
        pendingChanges={pendingChanges}
        originalValues={originalValues}
        validationResult={validationResult}
        isSaving={isPending}
        onConfirm={handleConfirmSave}
        onFixIssues={() => setShowConfirmCard(false)}
        onCancel={() => setShowConfirmCard(false)}
      />
    </form>
  );
}
