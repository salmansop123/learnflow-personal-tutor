"use client";

import { Label } from "@/components/ui/label";
import { SelectionGrid } from "@/components/profile/SelectionGrid";
import {
  LEARNING_STYLE_OPTIONS,
  STUDY_TIME_OPTIONS,
} from "@/lib/profile-constants";
import { resolveLearningStyles, resolveStudyTimes } from "@/lib/profile-habits";
import type { LearningStyle, OnboardingFormData, StudyTime } from "@/types/profile";

export function Step4Goals({
  formData,
  onChange,
  errors,
}: {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: unknown) => void;
  errors: Record<string, string>;
}) {
  const learningStyles = resolveLearningStyles(formData);
  const studyTimes = resolveStudyTimes(formData);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="dailyHours">
          Daily study goal (hours, optional)
        </Label>
        <input
          id="dailyHours"
          type="range"
          min={0.5}
          max={8}
          step={0.5}
          value={formData.dailyStudyHoursGoal ?? 2}
          onChange={(e) =>
            onChange("dailyStudyHoursGoal", Number(e.target.value))
          }
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          {formData.dailyStudyHoursGoal ?? 2} hours per day
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="learningGoals">Learning goals (optional)</Label>
        <textarea
          id="learningGoals"
          value={formData.learningGoals ?? ""}
          onChange={(e) => onChange("learningGoals", e.target.value || null)}
          rows={3}
          placeholder="e.g. Pass ECAT with 80%+, improve calculus..."
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label>Study habits — choose all that apply</Label>
        <p className="text-xs text-muted-foreground">
          How you learn best and when you prefer to study.
        </p>
        <SelectionGrid
          options={LEARNING_STYLE_OPTIONS}
          value={learningStyles}
          onChange={(v) => onChange("learningStyles", v as LearningStyle[])}
          multi
        />
        <SelectionGrid
          options={STUDY_TIME_OPTIONS}
          value={studyTimes}
          onChange={(v) => onChange("preferredStudyTimes", v as StudyTime[])}
          multi
        />
        {errors.learningStyles ? (
          <p className="text-sm text-destructive">{errors.learningStyles}</p>
        ) : null}
      </div>
    </div>
  );
}
