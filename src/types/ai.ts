export type ConversationRow = {
  id: string;
  title: string;
  subject: string | null;
  createdAt: string;
  messageCount?: number;
};

export type MessageRow = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  pinnedToNote: boolean;
  createdAt: string;
};

export type ConversationDetail = ConversationRow & {
  messages: MessageRow[];
};

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: string;
  language: string;
  educationLevel: string | null;
};

export const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "History",
  "English",
  "Economics",
  "General",
] as const;

export type SubjectOption = (typeof SUBJECT_OPTIONS)[number];
