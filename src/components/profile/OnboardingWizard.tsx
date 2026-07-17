"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Step1Identity } from "@/components/profile/steps/Step1Identity";
import { Step2Education } from "@/components/profile/steps/Step2Education";
import { Step3Subjects } from "@/components/profile/steps/Step3Subjects";
import { Step4Goals } from "@/components/profile/steps/Step4Goals";
import { Step5Exam } from "@/components/profile/steps/Step5Exam";
import { getArchetypeForCountry, resolveCountryCode } from "@/lib/country-education";
import {
  getOnboardingStepCount,
  needsExamStep,
  ONBOARDING_DRAFT_KEY,
} from "@/lib/profile-constants";
import { submitOnboarding } from "@/lib/profile";
import { toastError } from "@/lib/toast";
import type { EducationLevel, OnboardingFormData } from "@/types/profile";

const DEFAULT_FORM: OnboardingFormData = {
  fullName: "",
  language: "en",
  age: null,
  country: null,
  educationLevel: "SCHOOL",
  educationArchetype: "GENERIC",
  educationTier: "UPPER_SECONDARY",
  educationLevelLabel: "",
  educationTrack: null,
  educationArchetypeOverride: false,
  educationLevelId: "",
  gradeOrYear: "",
  universityLevel: null,
  subjectNames: [],
  weakSubjects: [],
  strongSubjects: [],
  dailyStudyHoursGoal: 2,
  preferredStudyTimes: [],
  learningGoals: null,
  learningStyles: ["DETAILED_EXPLANATIONS"],
  examType: null,
  examPrepDetails: null,
};

type StepDef = {
  id: number;
  title: string;
  subtitle: string;
};

const BASE_STEPS: StepDef[] = [
  { id: 1, title: "Tell us about yourself", subtitle: "Name, country, and language" },
  { id: 2, title: "Your education", subtitle: "Level and grade or year" },
  { id: 3, title: "Your subjects", subtitle: "What you are studying" },
  { id: 4, title: "Study habits", subtitle: "Goals and learning style" },
  { id: 5, title: "Exam preparation", subtitle: "Optional — share what test you are preparing for" },
];

export function OnboardingWizard({
  initialName,
}: {
  initialName?: string | null;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    ...DEFAULT_FORM,
    fullName: initialName ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const totalSteps = getOnboardingStepCount(
    formData.educationLevel,
    formData.educationTier
  );
  const activeSteps = useMemo(
    () =>
      needsExamStep(formData.educationLevel, formData.educationTier)
        ? BASE_STEPS
        : BASE_STEPS.filter((s) => s.id !== 5),
    [formData.educationLevel, formData.educationTier]
  );
  const stepIndex = Math.min(currentStep, activeSteps.length) - 1;
  const stepMeta = activeSteps[stepIndex];
  const progressPct = Math.round((currentStep / totalSteps) * 100);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          formData: OnboardingFormData;
          currentStep: number;
        };
        setFormData({ ...DEFAULT_FORM, ...parsed.formData });
        setCurrentStep(parsed.currentStep);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify({ formData, currentStep })
    );
  }, [formData, currentStep]);

  const onChange = useCallback(
    (field: keyof OnboardingFormData, value: unknown) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value } as OnboardingFormData;
        if (field === "country" && !prev.educationArchetypeOverride) {
          const code = resolveCountryCode(
            typeof value === "string" ? value : null
          );
          if (code) {
            next.educationArchetype = getArchetypeForCountry(code);
          }
        }
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    },
    []
  );

  function validateStep(step: number): boolean {
    const next: Record<string, string> = {};
    if (step === 1) {
      if (!formData.fullName.trim()) next.fullName = "Full name is required";
      if (!formData.language) next.language = "Select a language";
      if (!resolveCountryCode(formData.country))
        next.country = "Select your country";
    }
    if (step === 2) {
      if (!formData.educationLevelLabel?.trim())
        next.educationLevelLabel = "Select your education level";
      if (!formData.educationTier) next.educationTier = "Select education level";
      if (!formData.gradeOrYear.trim())
        next.gradeOrYear = "Grade or year is required";
      if (
        ["UNDERGRADUATE", "POSTGRADUATE", "DOCTORAL"].includes(
          formData.educationTier
        ) &&
        !formData.universityLevel
      ) {
        next.universityLevel = "Select your degree level";
      }
    }
    if (step === 3) {
      if (formData.subjectNames.length === 0)
        next.subjectNames = "Add at least one subject";
      const overlap = formData.weakSubjects.filter((w) =>
        formData.strongSubjects.some(
          (s) => s.toLowerCase() === w.toLowerCase()
        )
      );
      if (overlap.length > 0)
        next.weakSubjects = "A subject cannot be both weak and strong";
    }
    if (step === 4) {
      const styles =
        formData.learningStyles?.length > 0
          ? formData.learningStyles
          : formData.learningStyle
            ? [formData.learningStyle]
            : [];
      if (styles.length === 0)
        next.learningStyles = "Select at least one learning style";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(currentStep)) return;
    if (
      currentStep === 4 &&
      !needsExamStep(formData.educationLevel, formData.educationTier)
    ) {
      void handleSubmit();
      return;
    }
    if (currentStep >= totalSteps) {
      void handleSubmit();
      return;
    }
    setDirection(1);
    setCurrentStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) return;
    if (
      needsExamStep(formData.educationLevel, formData.educationTier) &&
      currentStep < 5
    ) {
      setDirection(1);
      setCurrentStep(5);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: OnboardingFormData = {
        ...formData,
        educationLevel: formData.educationLevel as EducationLevel,
      };
      if (!needsExamStep(formData.educationLevel, formData.educationTier)) {
        payload.examType = null;
        payload.examPrepDetails = null;
      } else if (!payload.examType?.trim() || payload.examType === "Other") {
        payload.examType = null;
      }
      await submitOnboarding(payload);
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      setCompleted(true);
      await update({ onboardingComplete: true });
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err) {
      toastError(err, "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStep() {
    const props = { formData, onChange, errors };
    switch (currentStep) {
      case 1:
        return <Step1Identity {...props} />;
      case 2:
        return <Step2Education {...props} />;
      case 3:
        return <Step3Subjects {...props} />;
      case 4:
        return <Step4Goals {...props} />;
      case 5:
        return <Step5Exam {...props} />;
      default:
        return null;
    }
  }

  if (completed) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900">Profile complete!</h2>
        <p className="text-slate-600">Taking you to your dashboard…</p>
      </div>
    );
  }

  const isLast =
    currentStep === totalSteps ||
    (currentStep === 4 &&
      !needsExamStep(formData.educationLevel, formData.educationTier));

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          {activeSteps.map((step, i) => {
            const n = i + 1;
            const done = n < currentStep;
            const active = n === currentStep;
            return (
              <div key={step.id} className="flex flex-1 items-center gap-1">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    done
                      ? "bg-sky-500 text-white"
                      : active
                        ? "ring-2 ring-sky-500 ring-offset-2"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </div>
                {i < activeSteps.length - 1 ? (
                  <div
                    className={`hidden h-0.5 flex-1 sm:block ${
                      done ? "bg-sky-500" : "bg-slate-200"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-500 to-violet-500"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <p className="text-sm text-slate-500">
          Step {currentStep} of {totalSteps} — {progressPct}% complete
        </p>
      </div>

      <div className="min-h-[400px]">
        <h2 className="text-2xl font-bold text-slate-900">{stepMeta?.title}</h2>
        <p className="mt-1 text-slate-500">{stepMeta?.subtitle}</p>
        <div className="mt-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {currentStep > 1 ? (
          <Button type="button" variant="ghost" onClick={goBack}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          onClick={goNext}
          disabled={isSubmitting}
          className="sm:min-w-[160px]"
        >
          {isSubmitting
            ? "Saving…"
            : isLast
              ? "Complete profile"
              : "Continue"}
        </Button>
      </div>
    </div>
  );
}
