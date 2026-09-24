export type AdminStats = {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersLastMonth: number;
  paidUsers: number;
  freeUsers: number;
  totalSessions: number;
  totalSessionHours: number;
  totalNotes: number;
  notesWithSummary: number;
  totalQuizzes: number;
  totalConversations: number;
  avgQuizScore: number;
  dailySignups: { date: string; count: number }[];
  weeklyActiveSessions: { week: string; count: number }[];
  planDistribution: Record<string, number>;
  topCountries: { country: string; count: number }[];
  educationLevelBreakdown: Record<string, number>;
};

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  createdAt: string | null;
  country: string | null;
  educationLevel: string | null;
  onboardingComplete: boolean;
  preferredLanguage: string;
  image: string | null;
};

export type AdminUsersResponse = {
  users: AdminUserRow[];
  total: number;
  page: number;
  totalPages: number;
  planCounts: Record<string, number>;
};

export type AdminUserDetail = {
  user: AdminUserRow & {
    fullName?: string | null;
    age?: number | null;
    gradeOrYear?: string | null;
  };
  stats: {
    studySessionCount: number;
    totalStudyHours: number;
    noteCount: number;
    quizCount: number;
    conversationCount: number;
    reminderCount: number;
    lastLogin: string | null;
  };
  quizAttempts: {
    id: string;
    subject: string;
    topic: string | null;
    score: number;
    difficulty: string;
    createdAt: string | null;
  }[];
  recentSessions: {
    id: string;
    subject: string;
    durationMins: number | null;
    startedAt: string | null;
  }[];
  auditTrail: {
    id: string;
    adminEmail: string;
    action: string;
    details: string | null;
    createdAt: string | null;
  }[];
};

export type AdminAuditLog = {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
};

export type AdminContentOverview = {
  totalNotes: number;
  notesWithSummary: number;
  averageNoteLength: number;
  totalQuizAttempts: number;
  averageScore: number;
  recentNotes: {
    id: string;
    title: string;
    userId: string;
    userEmail: string;
    subject: string | null;
    hasSummary: boolean;
    createdAt: string | null;
  }[];
  recentQuizzes: {
    id: string;
    userId: string;
    userEmail: string;
    subject: string;
    topic: string | null;
    score: number;
    difficulty: string;
    createdAt: string | null;
  }[];
  topSubjects: { subject: string; count: number }[];
  scoresOverTime: { date: string; avgScore: number }[];
};

export type AdminSystemHealth = {
  dbStatus: string;
  adminCount: number;
  adminEmails?: string[];
  envVarsPresent: Record<string, boolean>;
  uptime: number;
  nodeVersion: string;
  tableCounts: Record<string, number>;
  adminSlots: {
    slot: number;
    email: string | null;
    status: "Active" | "Empty";
  }[];
  currentAdmin: string;
};
