"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";

import { toast, toastError } from "@/lib/toast";

import { updateProfileAction } from "@/app/dashboard/settings/actions";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EducationLevel } from "@/types/profile";
import type { UserProfile } from "@/types/user";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ur", label: "Urdu" },
  { value: "ar", label: "Arabic" },
] as const;

const EDUCATION_LEVELS = [
  { value: "", label: "Not set" },
  { value: "SCHOOL", label: "School" },
  { value: "COLLEGE", label: "College" },
  { value: "UNIVERSITY", label: "University" },
  { value: "JOB_TEST", label: "Job / Test prep" },
] as const;

export function SettingsForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(profile.name ?? "");
  const [language, setLanguage] = useState(profile.language ?? "en");
  const [educationLevel, setEducationLevel] = useState(
    profile.educationLevel ?? ""
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const updated = await updateProfileAction({
          name: name.trim(),
          language,
          educationLevel: (educationLevel || null) as EducationLevel | null,
        });
        await update({ name: updated.name ?? name.trim() });
        toast.success("Profile saved successfully.");
        router.refresh();
      } catch (err) {
        toastError(err, "Failed to save profile");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ThemeSettings className="lg:col-span-2" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Update how LearnFlow addresses you and tailors the AI tutor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Display name</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                value={profile.email}
                disabled
                className="opacity-70"
              />
              <p className="text-xs text-muted-foreground">
                Email is managed through your sign-in provider.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-language">Language</Label>
              <select
                id="settings-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="form-select w-full"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Preferred language for AI responses when possible.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-education">Education level</Label>
              <select
                id="settings-education"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="form-select w-full"
              >
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level.value || "none"} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Used in the AI tutor system prompt for age-appropriate
                explanations.
              </p>
            </div>

            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {isPending ? "Saving…" : "Save changes"}
            </Button>

          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Plan and billing overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-accent/30 p-4">
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="mt-1 text-2xl font-bold capitalize">
              {profile.plan.toLowerCase()}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Upgrade or compare plans on the{" "}
            <a href="/dashboard/billing" className="text-primary hover:underline">
              Billing
            </a>{" "}
            page. Payment processing is not enabled in this MVP.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
