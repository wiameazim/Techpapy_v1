// Absolute backend URL — used only for the direct WebSocket connection
// (video-room.tsx), which isn't proxied. Plain REST calls below go through
// this site's own /api/* route instead (see next.config.ts rewrites), so
// their cookies stay same-site regardless of where the backend is hosted.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let accessToken: string | null = null;

function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type Role = "USER" | "ADMIN";
export type SkillType = "OFFERED" | "WANTED";
export type MatchStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export type PublicUser = { id: string; email: string; name: string; role: Role };

export type AuthResponse = {
  accessToken: string;
  user: PublicUser;
};

export type Skill = {
  id: string;
  name: string;
  type: SkillType;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string };
};

export type SessionItem = {
  id: string;
  matchId: string;
  scheduledAt: string;
  status: SessionStatus;
  createdAt: string;
};

export type Match = {
  id: string;
  userAId: string;
  userBId: string;
  status: MatchStatus;
  createdAt: string;
  userA: { id: string; name: string };
  userB: { id: string; name: string };
  sessions: SessionItem[];
};

export type SessionDetail = {
  session: SessionItem;
  match: Pick<Match, "id" | "userAId" | "userBId" | "status" | "createdAt" | "userA" | "userB">;
};

export type Me = {
  id: string;
  name: string;
  email: string;
  role: Role;
  points: number;
  createdAt: string;
  badges: { badge: { id: string; name: string; description: string }; awardedAt: string }[];
  skills: Skill[];
};

export type PointsEntry = { id: string; delta: number; reason: string; createdAt: string };

export type BadgeCatalogueEntry = {
  name: string;
  description: string;
  pointsRequired: number;
};

export type Article = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  points: number;
  createdAt: string;
};

export type AdminBadge = {
  id: string;
  name: string;
  description: string;
  _count: { users: number };
};

export type AdminUserBadge = {
  userId: string;
  badgeId: string;
  awardedAt: string;
  user: { id: string; name: string };
  badge: { id: string; name: string };
};

export type AdminPointsEntry = {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  createdAt: string;
  user: { id: string; name: string };
};

export type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  ip: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
};

export type AdminSession = SessionItem & {
  match: { id: string; userA: { id: string; name: string }; userB: { id: string; name: string } };
};

export type AdminStats = {
  users: { total: number; admins: number };
  skills: { total: number };
  matches: Partial<Record<MatchStatus, number>>;
  sessions: Partial<Record<SessionStatus, number>>;
  articles: { total: number };
  badges: { total: number };
  pointsDistributed: number;
  signupsByDay: { date: string; count: number }[];
  recentAuditLogs: AuditLog[];
};

async function withToken(promise: Promise<AuthResponse>) {
  const result = await promise;
  setAccessToken(result.accessToken);
  return result;
}

export const api = {
  register: (data: { name: string; email: string; password: string }) =>
    withToken(
      request<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ),
  login: (data: { email: string; password: string }) =>
    withToken(
      request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ),
  refresh: () => withToken(request<AuthResponse>("/api/auth/refresh", { method: "POST" })),
  logout: async () => {
    const res = await request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    setAccessToken(null);
    return res;
  },

  me: () => request<{ user: Me }>("/api/me"),
  myPoints: () => request<{ entries: PointsEntry[] }>("/api/me/points"),
  listBadges: () => request<{ badges: BadgeCatalogueEntry[] }>("/api/badges"),

  listSkills: (type?: SkillType) =>
    request<{ skills: Skill[] }>(`/api/skills${type ? `?type=${type}` : ""}`),
  createSkill: (data: { name: string; type: SkillType }) =>
    request<{ skill: Skill }>("/api/skills", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteSkill: (id: string) => request<void>(`/api/skills/${id}`, { method: "DELETE" }),

  listMatches: () => request<{ matches: Match[] }>("/api/matches"),
  createMatch: (targetUserId: string) =>
    request<{ match: Match }>("/api/matches", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    }),

  createSession: (data: { matchId: string; scheduledAt: string }) =>
    request<{ session: SessionItem }>("/api/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSession: (id: string) => request<SessionDetail>(`/api/sessions/${id}`),
  completeSession: (id: string) =>
    request<{ session: SessionItem }>(`/api/sessions/${id}/complete`, {
      method: "PATCH",
    }),

  listArticles: (q?: string) =>
    request<{ articles: Article[] }>(`/api/articles${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getArticle: (id: string) => request<{ article: Article }>(`/api/articles/${id}`),
  createArticle: (data: { title: string; content: string }) =>
    request<{ article: Article }>("/api/articles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteArticle: (id: string) => request<void>(`/api/articles/${id}`, { method: "DELETE" }),

  admin: {
    stats: () => request<AdminStats>("/api/admin/stats"),
    auditLogs: () => request<{ logs: AuditLog[] }>("/api/admin/audit-logs"),

    listUsers: () => request<{ users: AdminUser[] }>("/api/admin/users"),
    updateUser: (
      id: string,
      data: Partial<{ name: string; email: string; role: Role; points: number }>,
    ) =>
      request<{ user: AdminUser }>(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteUser: (id: string) => request<void>(`/api/admin/users/${id}`, { method: "DELETE" }),

    listSkills: () => request<{ skills: Skill[] }>("/api/admin/skills"),
    createSkill: (data: { name: string; type: SkillType; userId: string }) =>
      request<{ skill: Skill }>("/api/admin/skills", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateSkill: (id: string, data: Partial<{ name: string; type: SkillType }>) =>
      request<{ skill: Skill }>(`/api/admin/skills/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteSkill: (id: string) => request<void>(`/api/admin/skills/${id}`, { method: "DELETE" }),

    listMatches: () => request<{ matches: Match[] }>("/api/admin/matches"),
    createMatch: (data: { userAId: string; userBId: string; status?: MatchStatus }) =>
      request<{ match: Match }>("/api/admin/matches", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateMatch: (id: string, data: { status: MatchStatus }) =>
      request<{ match: Match }>(`/api/admin/matches/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteMatch: (id: string) => request<void>(`/api/admin/matches/${id}`, { method: "DELETE" }),

    listSessions: () => request<{ sessions: AdminSession[] }>("/api/admin/sessions"),
    createSession: (data: { matchId: string; scheduledAt: string; status?: SessionStatus }) =>
      request<{ session: SessionItem }>("/api/admin/sessions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateSession: (
      id: string,
      data: Partial<{ scheduledAt: string; status: SessionStatus }>,
    ) =>
      request<{ session: SessionItem }>(`/api/admin/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteSession: (id: string) =>
      request<void>(`/api/admin/sessions/${id}`, { method: "DELETE" }),

    listBadges: () => request<{ badges: AdminBadge[] }>("/api/admin/badges"),
    createBadge: (data: { name: string; description: string }) =>
      request<{ badge: AdminBadge }>("/api/admin/badges", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateBadge: (id: string, data: Partial<{ name: string; description: string }>) =>
      request<{ badge: AdminBadge }>(`/api/admin/badges/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteBadge: (id: string) => request<void>(`/api/admin/badges/${id}`, { method: "DELETE" }),

    listUserBadges: () => request<{ userBadges: AdminUserBadge[] }>("/api/admin/user-badges"),
    awardBadge: (data: { userId: string; badgeId: string }) =>
      request<{ userBadge: AdminUserBadge }>("/api/admin/user-badges", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    revokeBadge: (userId: string, badgeId: string) =>
      request<void>(`/api/admin/user-badges/${userId}/${badgeId}`, { method: "DELETE" }),

    listArticles: () => request<{ articles: Article[] }>("/api/admin/articles"),
    updateArticle: (id: string, data: Partial<{ title: string; content: string }>) =>
      request<{ article: Article }>(`/api/admin/articles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteArticle: (id: string) =>
      request<void>(`/api/admin/articles/${id}`, { method: "DELETE" }),

    listPointsLedger: () => request<{ entries: AdminPointsEntry[] }>("/api/admin/points-ledger"),
    createLedgerEntry: (data: { userId: string; delta: number; reason: string }) =>
      request<{ entry: AdminPointsEntry }>("/api/admin/points-ledger", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
