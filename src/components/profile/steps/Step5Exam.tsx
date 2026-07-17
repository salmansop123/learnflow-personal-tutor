"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { SelectionGrid } from "@/components/profile/SelectionGrid";
import { EXAM_OPTIONS } from "@/lib/profile-constants";
import type { OnboardingFormData } from "@/types/profile";

const EXAM_STEP_OPTIONS = [
  {
    id: "__none__",
    label: "Not preparing for a test",
    description: "Skip — you can add this later",
  },
  ...EXAM_OPTIONS,
];

export function Step5Exam({
  formData,
  onChange,
}: {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: unknown) => void;
  errors: Record<string, string>;
}) {
  const [customExam, setCustomExam] = useState(
    formData.examType && !EXAM_OPTIONS.some((e) => e.id === formData.examType)
      ? formData.examType
      : ""
  );

  const selectedExam =
    !formData.examType
      ? "__none__"
      : formData.examType &&
          EXAM_OPTIONS.some((e) => e.id === formData.examType)
        ? formData.examType
        : "Other";

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        This step is optional. Only fill it in if you are actively preparing for
        a specific exam or test.
      </p>
      <div className="space-y-2">
        <Label>What are you preparing for? (optional)</Label>
        <SelectionGrid
          options={EXAM_STEP_OPTIONS}
          value={selectedExam}
          onChange={(v) => {
            const id = v as string;
            if (id === "__none__") {
              onChange("examType", null);
              onChange("examPrepDetails", null);
              setCustomExam("");
              return;
            }
            if (id === "Other") {
              onChange("examType", customExam || "Other");
            } else {
              onChange("examType", id);
              setCustomExam("");
            }
          }}
        />
      </div>
      {(formData.examType === "Other" ||
        (formData.examType &&
          !EXAM_OPTIONS.some((e) => e.id === formData.examType))) && (
        <div className="space-y-2">
          <Label htmlFor="customExam">Your test name</Label>
          <input
            id="customExam"
            value={customExam}
            onChange={(e) => {
              setCustomExam(e.target.value);
              onChange("examType", e.target.value || null);
            }}
            className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
            placeholder="e.g. Punjab Board Finals"
          />
        </div>
      )}
      {formData.examType ? (
        <div className="space-y-2">
          <Label htmlFor="examDetails">More about your preparation (optional)</Label>
          <textarea
            id="examDetails"
            value={formData.examPrepDetails ?? ""}
            onChange={(e) => onChange("examPrepDetails", e.target.value || null)}
            rows={4}
            placeholder="Tell the AI about your timeline, target score, weak areas..."
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
          />
        </div>
      ) : null}
    </div>
  );
}
