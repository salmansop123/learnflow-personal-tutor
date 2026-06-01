import { serverApiFetch } from "@/lib/api-server";
import type { ConversationDetail, ConversationRow } from "@/types/ai";

export async function listConversations(
  userId: string
): Promise<ConversationRow[]> {
  return serverApiFetch<ConversationRow[]>("/conversations", userId);
}

export async function getConversation(
  userId: string,
  conversationId: string
): Promise<ConversationDetail> {
  return serverApiFetch<ConversationDetail>(
    `/conversations/${conversationId}`,
    userId
  );
}

export async function createConversation(
  userId: string,
  subject?: string | null
): Promise<ConversationRow> {
  return serverApiFetch<ConversationRow>("/conversations", userId, {
    method: "POST",
    body: JSON.stringify({
      title: "New Chat",
      subject: subject ?? null,
    }),
  });
}

export async function updateConversation(
  userId: string,
  conversationId: string,
  data: { title?: string; subject?: string | null }
): Promise<ConversationRow> {
  return serverApiFetch<ConversationRow>(
    `/conversations/${conversationId}`,
    userId,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  await serverApiFetch(`/conversations/${conversationId}`, userId, {
    method: "DELETE",
  });
}

export { getUserProfile } from "@/lib/users";

export async function appendConversationMessages(
  userId: string,
  conversationId: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<void> {
  await serverApiFetch(`/conversations/${conversationId}/messages`, userId, {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
