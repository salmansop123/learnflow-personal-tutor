"use client";

import { Label } from "@/components/ui/label";
import { SelectionGrid } from "@/components/profile/SelectionGrid";
import { SubjectPillInput } from "@/components/profile/SubjectPillInput";
import type { OnboardingFormData } from "@/types/profile";

export function Step3Subjects({
  formData,
  onChange,
  errors,
}: {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: unknown) => void;
  errors: Record<string, string>;
}) {
  const subjectOptions = formData.subjectNames.map((s) => ({
    id: s,
    label: s,
  }));

  function setWeak(next: string | string[]) {
    const ids = Array.isArray(next) ? next : [next];
    const strong = formData.strongSubjects.filter(
      (s) => !ids.some((w) => w.toLowerCase() === s.toLowerCase())
    );
    onChange("weakSubjects", ids);
    onChange("strongSubjects", strong);
  }

  function setStrong(next: string | string[]) {
    const ids = Array.isArray(next) ? next : [next];
    const weak = formData.weakSubjects.filter(
      (s) => !ids.some((w) => w.toLowerCase() === s.toLowerCase())
    );
    onChange("strongSubjects", ids);
    onChange("weakSubjects", weak);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Subjects you are studying</Label>
        <SubjectPillInput
          value={formData.subjectNames}
          onChange={(v) => onChange("subjectNames", v)}
        />
        {errors.subjectNames ? (
          <p className="text-sm text-destructive">{errors.subjectNames}</p>
        ) : null}
      </div>
      {formData.subjectNames.length > 0 ? (
        <>
          <div className="space-y-2">
            <Label>Subjects you want extra help with (optional)</Label>
            <SelectionGrid
              options={subjectOptions}
              value={formData.weakSubjects}
              onChange={setWeak}
              multi
            />
            {errors.weakSubjects ? (
              <p className="text-sm text-destructive">{errors.weakSubjects}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Subjects you are confident in (optional)</Label>
            <SelectionGrid
              options={subjectOptions}
              value={formData.strongSubjects}
              onChange={setStrong}
              multi
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
