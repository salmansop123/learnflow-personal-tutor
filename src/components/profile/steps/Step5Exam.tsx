"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { SelectionGrid } from "@/components/profile/SelectionGrid";
import { EXAM_OPTIONS } from "@/lib/profile-constants";
import type { OnboardingFormData } from "@/types/profile";

export function Step5Exam({
  formData,
  onChange,
  errors,
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

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>What are you preparing for?</Label>
        <SelectionGrid
          options={EXAM_OPTIONS}
          value={
            formData.examType &&
            EXAM_OPTIONS.some((e) => e.id === formData.examType)
              ? formData.examType
              : formData.examType
                ? "Other"
                : ""
          }
          onChange={(v) => {
            const id = v as string;
            if (id === "Other") {
              onChange("examType", customExam || "Other");
            } else {
              onChange("examType", id);
              setCustomExam("");
            }
          }}
        />
        {errors.examType ? (
          <p className="text-sm text-destructive">{errors.examType}</p>
        ) : null}
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
              onChange("examType", e.target.value);
            }}
            className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
            placeholder="e.g. Punjab Board Finals"
          />
        </div>
      )}
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
    </div>
  );
}
