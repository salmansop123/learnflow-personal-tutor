import { z } from "zod";

import { auth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-route";
import { serverApiFetch } from "@/lib/api-server";
import { normalizeSubjects } from "@/lib/subject-normalizer";
import type { OnboardingFormData, StudentProfile } from "@/types/profile";

const onboardingSchema = z.object({
  fullName: z.string().min(1).max(120),
  language: z.string().min(2).max(10),
  age: z.number().int().min(5).max(80).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  educationLevel: z.enum(["SCHOOL", "COLLEGE", "UNIVERSITY", "JOB_TEST"]),
  educationArchetype: z.string().max(40).optional(),
  educationTier: z.string().max(40).optional(),
  educationLevelLabel: z.string().min(1).max(120),
  educationTrack: z.string().nullable().optional(),
  educationArchetypeOverride: z.boolean().optional(),
  educationLevelId: z.string().max(80).optional(),
  gradeOrYear: z.string().min(1).max(80),
  universityLevel: z.enum(["BACHELORS", "MASTERS", "PHD"]).nullable().optional(),
  subjectNames: z.array(z.string()).min(1),
  weakSubjects: z.array(z.string()).default([]),
  strongSubjects: z.array(z.string()).default([]),
  dailyStudyHoursGoal: z.number().nullable().optional(),
  preferredStudyTimes: z
    .array(z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"]))
    .default([]),
  learningGoals: z.string().max(2000).nullable().optional(),
  learningStyles: z
    .array(
      z.enum([
        "SHORT_NOTES",
        "DETAILED_EXPLANATIONS",
        "VISUAL_LEARNING",
        "QUIZ_BASED",
      ])
    )
    .min(1),
  examType: z.string().max(120).nullable().optional(),
  examPrepDetails: z.string().max(2000).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }
    const parsed = onboardingSchema.parse(
      await req.json()
    ) as OnboardingFormData;
    const body: OnboardingFormData = {
      ...parsed,
      subjectNames: normalizeSubjects(parsed.subjectNames ?? [], []),
      weakSubjects: normalizeSubjects(parsed.weakSubjects ?? [], []),
      strongSubjects: normalizeSubjects(parsed.strongSubjects ?? [], []),
    };
    const profile = await serverApiFetch<StudentProfile>(
      "/profile/onboarding",
      session.user.id,
      { method: "POST", body: JSON.stringify(body) }
    );
    return Response.json(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}
