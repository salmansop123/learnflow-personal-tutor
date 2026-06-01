import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { noteContentPlainText } from "@/lib/note-content";
import type { NoteRow } from "@/types/note";
import type { StudySessionRow } from "@/types/study";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica" },
  title: { fontSize: 20, marginBottom: 12, fontWeight: "bold" },
  subtitle: { fontSize: 12, color: "#666666", marginBottom: 8 },
  meta: { fontSize: 10, color: "#888888", marginBottom: 20 },
  content: { fontSize: 11, lineHeight: 1.6, color: "#333333", marginBottom: 6 },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
    gap: 6,
  },
  tag: {
    fontSize: 9,
    backgroundColor: "#EEF4FB",
    padding: 4,
    marginRight: 6,
    borderRadius: 3,
  },
  sectionTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 11,
  },
  rowLabel: { color: "#333333" },
  rowValue: { color: "#666666" },
});

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function ContentLines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Text key={i} style={styles.content}>
          {line || " "}
        </Text>
      ))}
    </>
  );
}

export function NoteDocument({ note }: { note: NoteRow }) {
  return (
    <Document title={note.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{note.title}</Text>
        {note.subject ? (
          <Text style={styles.subtitle}>Subject: {note.subject}</Text>
        ) : null}
        <Text style={styles.meta}>
          Updated {formatDate(note.updatedAt)}
          {note.pinnedFrom ? " · Pinned from AI tutor" : ""}
        </Text>
        {note.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {note.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        ) : null}
        <ContentLines text={noteContentPlainText(note.content)} />
      </Page>
    </Document>
  );
}

export type StudySessionsPdfData = {
  sessions: StudySessionRow[];
  hoursBySubject: Record<string, number>;
  exportedAt?: string;
};

function formatDuration(mins: number | null): string {
  if (mins == null) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function StudySessionsDocument({ data }: { data: StudySessionsPdfData }) {
  const completed = data.sessions.filter((s) => s.endedAt != null);
  const exportedAt = data.exportedAt ?? new Date().toISOString();

  return (
    <Document title="Study Session History">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Study Session History</Text>
        <Text style={styles.meta}>Exported {formatDate(exportedAt)}</Text>

        {Object.keys(data.hoursBySubject).length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Hours by subject</Text>
            {Object.entries(data.hoursBySubject).map(([subject, mins]) => (
              <View key={subject} style={styles.row}>
                <Text style={styles.rowLabel}>{subject}</Text>
                <Text style={styles.rowValue}>{(mins / 60).toFixed(1)} h</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          Sessions ({completed.length})
        </Text>
        {completed.length === 0 ? (
          <Text style={styles.content}>No completed sessions yet.</Text>
        ) : (
          completed.map((session) => (
            <View key={session.id} style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{session.subject}</Text>
                <Text style={styles.rowValue}>
                  {formatDuration(session.durationMins)}
                </Text>
              </View>
              <Text style={styles.meta}>
                {formatDate(session.startedAt)}
                {session.endedAt ? ` – ${formatDate(session.endedAt)}` : ""}
              </Text>
              {session.notes ? (
                <Text style={styles.content}>{session.notes}</Text>
              ) : null}
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
