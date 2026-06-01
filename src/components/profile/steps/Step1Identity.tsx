"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectionGrid } from "@/components/profile/SelectionGrid";
import { getCountryOptions } from "@/lib/country-education";
import { LANGUAGE_OPTIONS } from "@/lib/profile-constants";
import type { OnboardingFormData } from "@/types/profile";

export function Step1Identity({
  formData,
  onChange,
  errors,
}: {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: unknown) => void;
  errors: Record<string, string>;
}) {
  const countries = getCountryOptions();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
          placeholder="Your full name"
          className="bg-white"
        />
        {errors.fullName ? (
          <p className="text-sm text-destructive">{errors.fullName}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="age">Age (optional)</Label>
        <Input
          id="age"
          type="number"
          min={5}
          max={80}
          value={formData.age ?? ""}
          onChange={(e) =>
            onChange("age", e.target.value ? Number(e.target.value) : null)
          }
          className="bg-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <select
          id="country"
          value={formData.country ?? ""}
          onChange={(e) => onChange("country", e.target.value || null)}
          className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
        >
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
        {errors.country ? (
          <p className="text-sm text-destructive">{errors.country}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label>Preferred language for AI responses</Label>
        <SelectionGrid
          options={LANGUAGE_OPTIONS.map((l) => ({
            id: l.id,
            label: l.label,
          }))}
          value={formData.language}
          onChange={(v) => onChange("language", v as string)}
        />
        {errors.language ? (
          <p className="text-sm text-destructive">{errors.language}</p>
        ) : null}
      </div>
    </div>
  );
}
