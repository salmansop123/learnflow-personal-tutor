export async function streamNoteSummary({
  content,
  noteId,
  subject,
  onChunk,
}: {
  content: string;
  noteId: string | null;
  subject: string | null;
  onChunk: (text: string) => void;
}): Promise<string> {
  const response = await fetch("/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      noteId,
      subject,
    }),
  });

  if (!response.ok) throw new Error("Failed to generate summary");

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullSummary = "";

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullSummary += chunk;
      onChunk(fullSummary);
    }
  } else {
    const data = (await response.json()) as {
      summary?: string;
      text?: string;
    };
    fullSummary = data.summary ?? data.text ?? "";
    onChunk(fullSummary);
  }

  return fullSummary;
}

export async function persistNoteSummary(
  noteId: string,
  summary: string
): Promise<string> {
  const generatedAt = new Date().toISOString();
  await fetch(`/api/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      aiSummary: summary,
      aiSummaryGeneratedAt: generatedAt,
    }),
  });
  return generatedAt;
}
