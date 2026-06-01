export type NoteRow = {
  id: string;
  title: string;
  content: string;
  subject: string | null;
  tags: string[];
  pinnedFrom: string | null;
  fileUrl: string | null;
  aiSummary?: string | null;
  aiSummaryGeneratedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteCreateInput = {
  title: string;
  content: string;
  subject?: string | null;
  tags?: string[];
  pinnedFrom?: string | null;
  fileUrl?: string | null;
};

export type NoteUpdateInput = {
  title?: string;
  content?: string;
  subject?: string | null;
  tags?: string[];
  pinnedFrom?: string | null;
  fileUrl?: string | null;
  aiSummary?: string | null;
  aiSummaryGeneratedAt?: string | null;
};
