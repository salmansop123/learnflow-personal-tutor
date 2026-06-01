"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getArchetypeForCountry,
  getCountryName,
  resolveCountryCode,
} from "@/lib/country-education";
import {
  EDUCATION_SYSTEMS,
  findLevelById,
  getLevelsForArchetype,
  getSystemForArchetype,
  type EducationArchetype,
  type EducationLevelOption,
  type EducationTier,
} from "@/lib/education-systems";
import {
  legacyEducationLevelFromTier,
  universityLevelFromTier,
} from "@/lib/education-legacy";
import type { OnboardingFormData, UniversityLevel } from "@/types/profile";

const ARCHETYPE_ORDER: EducationArchetype[] = [
  "SOUTH_ASIAN",
  "INDIAN",
  "BRITISH",
  "NORTH_AMERICAN",
  "EUROPEAN_CONTINENTAL",
  "EAST_ASIAN",
  "GENERIC",
];

const EU_UPPER_SECONDARY_IDS = new Set([
  "eu-upper-academic",
  "eu-upper-vocational",
]);

const DEGREE_TIERS = new Set<EducationTier>([
  "UNDERGRADUATE",
  "POSTGRADUATE",
  "DOCTORAL",
]);

const DEGREE_PILLS: { value: UniversityLevel; label: string }[] = [
  { value: "BACHELORS", label: "Bachelor's Degree" },
  { value: "MASTERS", label: "Master's / MPhil" },
  { value: "PHD", label: "PhD" },
];

function mapTierToLegacy(tier: EducationTier) {
  return legacyEducationLevelFromTier(tier);
}

function applyLevelSelection(
  archetype: EducationArchetype,
  level: EducationLevelOption
): Partial<OnboardingFormData> {
  return {
    educationLevelId: level.id,
    educationArchetype: archetype,
    educationLevelLabel: level.displayLabel,
    educationTier: level.tier,
    educationTrack: level.track ?? null,
    educationLevel: mapTierToLegacy(level.tier),
    universityLevel: universityLevelFromTier(level.tier),
  };
}

function LevelRadioRow({
  level,
  selected,
  onSelect,
  className = "",
  title,
  description,
}: {
  level: EducationLevelOption;
  selected: boolean;
  onSelect: () => void;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full cursor-pointer rounded-lg border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-l-4 border-l-blue-500 border-blue-200 bg-[#EFF6FF]"
          : "border-slate-200 bg-white hover:border-slate-300"
      } ${className}`}
    >
      <span
        className={`block font-semibold ${
          selected ? "text-blue-700" : "text-slate-900"
        }`}
      >
        {title ?? level.displayLabel}
      </span>
      {description ? (
        <span className="mt-1 block text-sm text-slate-500">{description}</span>
      ) : null}
    </button>
  );
}

export function Step2Education({
  formData,
  onChange,
  errors,
}: {
  formData: OnboardingFormData;
  onChange: (field: keyof OnboardingFormData, value: unknown) => void;
  errors: Record<string, string>;
}) {
  const countryCode = resolveCountryCode(formData.country);
  const detectedArchetype = countryCode
    ? getArchetypeForCountry(countryCode)
    : "GENERIC";

  const activeArchetype = (
    formData.educationArchetypeOverride
      ? formData.educationArchetype
      : detectedArchetype
  ) as EducationArchetype;

  const system = useMemo(
    () => getSystemForArchetype(activeArchetype),
    [activeArchetype]
  );

  const levels = useMemo(
    () => getLevelsForArchetype(activeArchetype),
    [activeArchetype]
  );

  const selectedLevel = formData.educationLevelId
    ? findLevelById(activeArchetype, formData.educationLevelId)
    : levels.find(
        (l) =>
          l.displayLabel === formData.educationLevelLabel &&
          l.tier === formData.educationTier &&
          (l.track ?? null) === (formData.educationTrack ?? null)
      );

  const showDegreePills =
    selectedLevel != null && DEGREE_TIERS.has(selectedLevel.tier);

  const [archetypePanelOpen, setArchetypePanelOpen] = useState(false);
  const [countryChangedNotice, setCountryChangedNotice] = useState<string | null>(
    null
  );
  const prevCountryRef = useRef<string | null>(null);

  useEffect(() => {
    if (formData.educationArchetypeOverride) {
      prevCountryRef.current = countryCode ?? "";
      return;
    }

    const code = countryCode ?? "";
    const archetype = detectedArchetype;
    const prevCode = prevCountryRef.current;

    if (
      prevCode !== null &&
      prevCode !== code &&
      formData.educationArchetype !== archetype
    ) {
      const countryLabel = code ? getCountryName(code) : "your new country";
      setCountryChangedNotice(countryLabel);
      onChange("educationArchetype", archetype);
      onChange("educationLevelLabel", "");
      onChange("educationTier", "");
      onChange("educationTrack", null);
      onChange("educationLevelId", "");
      onChange("gradeOrYear", "");
      onChange("universityLevel", null);
      onChange("educationLevel", "SCHOOL");
    } else if (formData.educationArchetype !== archetype) {
      onChange("educationArchetype", archetype);
    }

    prevCountryRef.current = code;
  }, [
    countryCode,
    detectedArchetype,
    formData.educationArchetype,
    formData.educationArchetypeOverride,
    onChange,
  ]);

  function patchLevel(level: EducationLevelOption) {
    const patch = applyLevelSelection(activeArchetype, level);
    for (const [k, v] of Object.entries(patch)) {
      onChange(k as keyof OnboardingFormData, v);
    }
    setCountryChangedNotice(null);
  }

  function selectArchetype(archetype: EducationArchetype) {
    onChange("educationArchetype", archetype);
    onChange("educationArchetypeOverride", true);
    onChange("educationLevelLabel", "");
    onChange("educationTier", "");
    onChange("educationTrack", null);
    onChange("educationLevelId", "");
    onChange("gradeOrYear", "");
    onChange("universityLevel", null);
    setArchetypePanelOpen(false);
    setCountryChangedNotice(null);
  }

  const regularLevels = levels.filter((l) => !EU_UPPER_SECONDARY_IDS.has(l.id));
  const euAcademic = levels.find((l) => l.id === "eu-upper-academic");
  const euVocational = levels.find((l) => l.id === "eu-upper-vocational");
  const isEuropean = activeArchetype === "EUROPEAN_CONTINENTAL";

  return (
    <div className="space-y-6">
      {/* SUB-SECTION A — Auto-detection notice */}
      <div className="rounded-xl bg-[#EFF6FF] p-4">
        <div className="flex gap-3">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-slate-800">
              {countryCode ? (
                <>
                  Based on <strong>{getCountryName(countryCode)}</strong>, we&apos;re
                  showing the <strong>{system.displayName}</strong> system.
                </>
              ) : (
                <>
                  Select your country in Step 1 for automatic system detection.
                  Showing generic options for now.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setArchetypePanelOpen((o) => !o)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {archetypePanelOpen
                ? "Using a different system? Hide ▴"
                : "Using a different system? Change it ▾"}
            </button>
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: archetypePanelOpen ? "auto" : 0,
            opacity: archetypePanelOpen ? 1 : 0,
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ARCHETYPE_ORDER.map((arch) => {
              const sys = EDUCATION_SYSTEMS[arch];
              const selected =
                formData.educationArchetypeOverride &&
                formData.educationArchetype === arch;
              return (
                <button
                  key={arch}
                  type="button"
                  onClick={() => selectArchetype(arch)}
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
        </motion.div>
      </div>

      {countryChangedNotice ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          We updated your education system to match {countryChangedNotice}. Please
          re-select your level.
        </div>
      ) : null}

      {/* SUB-SECTION B — Education level selector */}
      <div className="space-y-2">
        <Label>Your education level</Label>
        <div
          className="space-y-2"
          role="radiogroup"
          aria-label="Education level"
        >
          {isEuropean ? (
            <>
              {regularLevels.map((level) => (
                <LevelRadioRow
                  key={level.id}
                  level={level}
                  selected={selectedLevel?.id === level.id}
                  onSelect={() => patchLevel(level)}
                />
              ))}
              <p className="pt-1 text-sm font-semibold text-slate-700">
                Upper Secondary
              </p>
              {euAcademic ? (
                <LevelRadioRow
                  level={euAcademic}
                  selected={selectedLevel?.id === euAcademic.id}
                  onSelect={() => patchLevel(euAcademic)}
                  className="ml-4"
                  title="Academic Track — Gymnasium / Lycée / VWO"
                  description="University-preparatory. Advanced theory and sciences."
                />
              ) : null}
              {euVocational ? (
                <LevelRadioRow
                  level={euVocational}
                  selected={selectedLevel?.id === euVocational.id}
                  onSelect={() => patchLevel(euVocational)}
                  className="ml-4"
                  title="Vocational Track — Berufsschule / BTS / MBO"
                  description="Hands-on apprenticeship and applied skills."
                />
              ) : null}
            </>
          ) : (
            levels.map((level) => (
              <LevelRadioRow
                key={level.id}
                level={level}
                selected={selectedLevel?.id === level.id}
                onSelect={() => patchLevel(level)}
              />
            ))
          )}
        </div>
        {errors.educationLevelLabel || errors.educationLevel ? (
          <p className="text-sm text-destructive">
            {errors.educationLevelLabel ?? errors.educationLevel}
          </p>
        ) : null}
        {errors.educationTier ? (
          <p className="text-sm text-destructive">{errors.educationTier}</p>
        ) : null}
      </div>

      {/* SUB-SECTION C — Grade / year input */}
      <AnimatePresence>
        {selectedLevel ? (
          <motion.div
            key="grade-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <Label htmlFor="gradeOrYear">{selectedLevel.gradeInputLabel}</Label>
              <Input
                id="gradeOrYear"
                value={formData.gradeOrYear}
                onChange={(e) => onChange("gradeOrYear", e.target.value)}
                placeholder={selectedLevel.gradeExamples}
                className="bg-white"
              />
              {errors.gradeOrYear ? (
                <p className="text-sm text-destructive">{errors.gradeOrYear}</p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showDegreePills ? (
          <motion.div
            key="degree-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <Label>What level is your degree?</Label>
              <div className="flex flex-wrap gap-2">
                {DEGREE_PILLS.map((pill) => {
                  const selected = formData.universityLevel === pill.value;
                  return (
                    <button
                      key={pill.value}
                      type="button"
                      onClick={() => onChange("universityLevel", pill.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        selected
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
              {errors.universityLevel ? (
                <p className="text-sm text-destructive">{errors.universityLevel}</p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
