"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  createConversation,
  deleteConversation,
  updateConversation,
} from "@/lib/conversations";
import type { ConversationRow } from "@/types/ai";

export async function startNewConversationAction(
  subject?: string | null
): Promise<ConversationRow> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const conversation = await createConversation(
    session.user.id,
    subject ?? null
  );
  revalidatePath("/dashboard/ai-tutor");
  revalidatePath("/dashboard");
  return conversation;
}

export async function renameConversationAction(
  conversationId: string,
  title: string
): Promise<ConversationRow> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Title cannot be empty");
  }

  const updated = await updateConversation(session.user.id, conversationId, {
    title: trimmed.slice(0, 120),
  });
  revalidatePath("/dashboard/ai-tutor");
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteConversationAction(
  conversationId: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await deleteConversation(session.user.id, conversationId);
  revalidatePath("/dashboard/ai-tutor");
  revalidatePath("/dashboard");
}
