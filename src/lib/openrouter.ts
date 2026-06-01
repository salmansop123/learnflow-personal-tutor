import { createOpenAI } from "@ai-sdk/openai";

const baseURL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

/** Trim so pasted keys with stray spaces/newlines still work. */
const apiKey = (process.env.OPENROUTER_API_KEY ?? "").trim();

export const openrouter = createOpenAI({
  baseURL,
  apiKey,
  headers: {
    "HTTP-Referer": process.env.AUTH_URL ?? "http://localhost:3000",
    "X-Title": "LearnFlow AI Tutor",
  },
});

export const MODELS = {
  tutor: "google/gemini-2.0-flash-001",
  quiz: "openai/gpt-4o-mini",
  summary: "anthropic/claude-3-haiku",
} as const;

export type ModelKey = keyof typeof MODELS;

function requireApiKey() {
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
}

/** OpenRouter expects chat completions (`/chat/completions`), not the Responses API. */
export function getTutorModel() {
  requireApiKey();
  return openrouter.chat(MODELS.tutor);
}

export function getQuizModel() {
  requireApiKey();
  return openrouter.chat(MODELS.quiz);
}

export function getSummaryModel() {
  requireApiKey();
  return openrouter.chat(MODELS.summary);
}
