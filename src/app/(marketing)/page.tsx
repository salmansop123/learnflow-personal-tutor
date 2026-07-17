import { AIPreview } from "@/components/marketing/AIPreview";
import { CTA } from "@/components/marketing/CTA";
import { Features } from "@/components/marketing/Features";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { LearningToolsShowcase } from "@/components/marketing/LearningToolsShowcase";
import { PricingTable } from "@/components/marketing/PricingTable";
import { StudyProductivityShowcase } from "@/components/marketing/StudyProductivityShowcase";
import { Testimonials } from "@/components/marketing/Testimonials";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LearnFlow AI-Powered Personal Tutor",
  description:
    "Study smarter with AI tutoring, smart notes, adaptive quizzes, and structured study plans.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <AIPreview />
      <StudyProductivityShowcase />
      <LearningToolsShowcase />
      <Testimonials />
      <PricingTable />
      <CTA />
    </>
  );
}
