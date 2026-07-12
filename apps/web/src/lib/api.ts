export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let accessToken: string | null = null;

function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
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
};
