import { z } from "zod";

import { auth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-route";
import { getProfile, updateProfile } from "@/lib/profile";
import { normalizeSubjects } from "@/lib/subject-normalizer";
import type { ProfileUpdateInput } from "@/types/profile";

const profilePatchSchema = z.object({
  name: z.string().max(120).optional(),
  language: z.string().min(2).max(10).optional(),
  fullName: z.string().min(1).max(120).nullable().optional(),
  age: z.number().int().min(5).max(80).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  educationLevel: z
    .enum(["SCHOOL", "COLLEGE", "UNIVERSITY", "JOB_TEST"])
    .nullable()
    .optional(),
  educationArchetype: z.string().max(40).optional(),
  educationTier: z.string().max(40).optional(),
  educationLevelLabel: z.string().max(120).optional(),
  educationTrack: z.string().nullable().optional(),
  educationArchetypeOverride: z.boolean().optional(),
  educationLevelId: z.string().max(80).optional(),
  gradeOrYear: z.string().max(80).nullable().optional(),
  universityLevel: z.enum(["BACHELORS", "MASTERS", "PHD"]).nullable().optional(),
  totalSubjects: z.number().int().min(0).nullable().optional(),
  subjectNames: z.array(z.string()).optional(),
  weakSubjects: z.array(z.string()).optional(),
  strongSubjects: z.array(z.string()).optional(),
  dailyStudyHoursGoal: z.number().nullable().optional(),
  preferredStudyTime: z
    .enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"])
    .nullable()
    .optional(),
  preferredStudyTimes: z
    .array(z.enum(["MORNING", "AFTERNOON", "EVENING", "NIGHT"]))
    .optional(),
  learningGoals: z.string().max(2000).nullable().optional(),
  learningStyle: z
    .enum([
      "SHORT_NOTES",
      "DETAILED_EXPLANATIONS",
      "VISUAL_LEARNING",
      "QUIZ_BASED",
    ])
    .nullable()
    .optional(),
  learningStyles: z
    .array(
      z.enum([
        "SHORT_NOTES",
        "DETAILED_EXPLANATIONS",
        "VISUAL_LEARNING",
        "QUIZ_BASED",
      ])
    )
    .optional(),
  examType: z.string().max(120).nullable().optional(),
  examPrepDetails: z.string().max(2000).nullable().optional(),
  onboardingComplete: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }
    const profile = await getProfile(session.user.id);
    return Response.json(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }
    const parsed = profilePatchSchema.parse(await req.json()) as ProfileUpdateInput;
    const body: ProfileUpdateInput = { ...parsed };

    if (body.subjectNames != null) {
      body.subjectNames = normalizeSubjects(body.subjectNames, []);
    }
    if (body.weakSubjects != null) {
      body.weakSubjects = normalizeSubjects(body.weakSubjects, []);
    }
    if (body.strongSubjects != null) {
      body.strongSubjects = normalizeSubjects(body.strongSubjects, []);
    }

    const profile = await updateProfile(session.user.id, body);
    return Response.json(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}
