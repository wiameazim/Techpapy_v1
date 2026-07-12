import { Router } from "express";
import { z } from "zod";
import type { MatchStatus, Prisma, SessionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../middleware/errorHandler";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/auth";
import { awardBadges } from "../lib/badges";
import { recordAudit } from "../lib/audit";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

// ---------- Overview / monitoring ----------

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 13);

    const [
      userCount,
      adminCount,
      skillCount,
      matchesByStatus,
      sessionsByStatus,
      articleCount,
      badgeCount,
      pointsAgg,
      recentUsers,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.skill.count(),
      prisma.match.groupBy({ by: ["status"], _count: true }),
      prisma.session.groupBy({ by: ["status"], _count: true }),
      prisma.knowledgeArticle.count(),
      prisma.badge.count(),
      prisma.pointsLedger.aggregate({ _sum: { delta: true } }),
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const signupsByDay: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + i);
      signupsByDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const u of recentUsers) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (key in signupsByDay) signupsByDay[key] += 1;
    }

    res.json({
      users: { total: userCount, admins: adminCount },
      skills: { total: skillCount },
      matches: Object.fromEntries(
        matchesByStatus.map((m: { status: MatchStatus; _count: number }) => [m.status, m._count]),
      ),
      sessions: Object.fromEntries(
        sessionsByStatus.map((s: { status: SessionStatus; _count: number }) => [s.status, s._count]),
      ),
      articles: { total: articleCount },
      badges: { total: badgeCount },
      pointsDistributed: pointsAgg._sum.delta ?? 0,
      signupsByDay: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
      recentAuditLogs,
    });
  }),
);

adminRouter.get(
  "/audit-logs",
  asyncHandler(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ logs });
  }),
);

// ---------- Users ----------

adminRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, points: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  }),
);

const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  points: z.number().int().min(0).optional(),
});

adminRouter.patch(
  "/users/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: input,
      select: { id: true, name: true, email: true, role: true, points: true, createdAt: true },
    });
    await recordAudit("admin.user.update", req, {
      userId: req.user!.id,
      metadata: { targetId: user.id, changes: input },
    });
    res.json({ user });
  }),
);

adminRouter.delete(
  "/users/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    if (req.params.id === req.user!.id) {
      throw new HttpError(400, "Impossible de supprimer son propre compte");
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    await recordAudit("admin.user.delete", req, {
      userId: req.user!.id,
      metadata: { targetId: req.params.id },
    });
    res.status(204).send();
  }),
);

// ---------- Skills ----------

adminRouter.get(
  "/skills",
  asyncHandler(async (_req, res) => {
    const skills = await prisma.skill.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ skills });
  }),
);

const createSkillSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(["OFFERED", "WANTED"]),
  userId: z.string().uuid(),
});

adminRouter.post(
  "/skills",
  asyncHandler(async (req, res) => {
    const input = createSkillSchema.parse(req.body);
    const skill = await prisma.skill.create({
      data: input,
      include: { user: { select: { id: true, name: true } } },
    });
    res.status(201).json({ skill });
  }),
);

const updateSkillSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  type: z.enum(["OFFERED", "WANTED"]).optional(),
});

adminRouter.patch(
  "/skills/:id",
  asyncHandler(async (req, res) => {
    const input = updateSkillSchema.parse(req.body);
    const skill = await prisma.skill.update({
      where: { id: req.params.id },
      data: input,
      include: { user: { select: { id: true, name: true } } },
    });
    res.json({ skill });
  }),
);

adminRouter.delete(
  "/skills/:id",
  asyncHandler(async (req, res) => {
    await prisma.skill.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// ---------- Matches ----------

adminRouter.get(
  "/matches",
  asyncHandler(async (_req, res) => {
    const matches = await prisma.match.findMany({
      include: {
        userA: { select: { id: true, name: true } },
        userB: { select: { id: true, name: true } },
        sessions: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ matches });
  }),
);

const createMatchSchema = z.object({
  userAId: z.string().uuid(),
  userBId: z.string().uuid(),
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

adminRouter.post(
  "/matches",
  asyncHandler(async (req, res) => {
    const input = createMatchSchema.parse(req.body);
    if (input.userAId === input.userBId) {
      throw new HttpError(400, "Un match nécessite deux utilisateurs différents");
    }
    const match = await prisma.match.create({
      data: input,
      include: {
        userA: { select: { id: true, name: true } },
        userB: { select: { id: true, name: true } },
        sessions: true,
      },
    });
    res.status(201).json({ match });
  }),
);

const updateMatchSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"]),
});

adminRouter.patch(
  "/matches/:id",
  asyncHandler(async (req, res) => {
    const input = updateMatchSchema.parse(req.body);
    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: input,
      include: {
        userA: { select: { id: true, name: true } },
        userB: { select: { id: true, name: true } },
        sessions: true,
      },
    });
    res.json({ match });
  }),
);

adminRouter.delete(
  "/matches/:id",
  asyncHandler(async (req, res) => {
    await prisma.match.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// ---------- Sessions ----------

adminRouter.get(
  "/sessions",
  asyncHandler(async (_req, res) => {
    const sessions = await prisma.session.findMany({
      include: {
        match: {
          include: {
            userA: { select: { id: true, name: true } },
            userB: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ sessions });
  }),
);

const createSessionSchema = z.object({
  matchId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
});

adminRouter.post(
  "/sessions",
  asyncHandler(async (req, res) => {
    const input = createSessionSchema.parse(req.body);
    const session = await prisma.session.create({ data: input });
    res.status(201).json({ session });
  }),
);

const updateSessionSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
});

adminRouter.patch(
  "/sessions/:id",
  asyncHandler(async (req, res) => {
    const input = updateSessionSchema.parse(req.body);
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: input,
    });
    res.json({ session });
  }),
);

adminRouter.delete(
  "/sessions/:id",
  asyncHandler(async (req, res) => {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// ---------- Badges ----------

adminRouter.get(
  "/badges",
  asyncHandler(async (_req, res) => {
    const badges = await prisma.badge.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ badges });
  }),
);

const createBadgeSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(2).max(300),
});

adminRouter.post(
  "/badges",
  asyncHandler(async (req, res) => {
    const input = createBadgeSchema.parse(req.body);
    const badge = await prisma.badge.create({ data: input });
    res.status(201).json({ badge });
  }),
);

const updateBadgeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().min(2).max(300).optional(),
});

adminRouter.patch(
  "/badges/:id",
  asyncHandler(async (req, res) => {
    const input = updateBadgeSchema.parse(req.body);
    const badge = await prisma.badge.update({ where: { id: req.params.id }, data: input });
    res.json({ badge });
  }),
);

adminRouter.delete(
  "/badges/:id",
  asyncHandler(async (req, res) => {
    await prisma.badge.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// ---------- User <-> Badge assignments ----------

adminRouter.get(
  "/user-badges",
  asyncHandler(async (_req, res) => {
    const userBadges = await prisma.userBadge.findMany({
      include: {
        user: { select: { id: true, name: true } },
        badge: { select: { id: true, name: true } },
      },
      orderBy: { awardedAt: "desc" },
    });
    res.json({ userBadges });
  }),
);

const awardBadgeSchema = z.object({
  userId: z.string().uuid(),
  badgeId: z.string().uuid(),
});

adminRouter.post(
  "/user-badges",
  asyncHandler(async (req, res) => {
    const input = awardBadgeSchema.parse(req.body);
    const userBadge = await prisma.userBadge.create({
      data: input,
      include: {
        user: { select: { id: true, name: true } },
        badge: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ userBadge });
  }),
);

adminRouter.delete(
  "/user-badges/:userId/:badgeId",
  asyncHandler(async (req, res) => {
    await prisma.userBadge.delete({
      where: {
        userId_badgeId: { userId: req.params.userId, badgeId: req.params.badgeId },
      },
    });
    res.status(204).send();
  }),
);

// ---------- Articles ----------

adminRouter.get(
  "/articles",
  asyncHandler(async (_req, res) => {
    const articles = await prisma.knowledgeArticle.findMany({
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ articles });
  }),
);

const updateArticleSchema = z.object({
  title: z.string().min(3).max(160).optional(),
  content: z.string().min(10).max(20000).optional(),
});

adminRouter.patch(
  "/articles/:id",
  asyncHandler(async (req, res) => {
    const input = updateArticleSchema.parse(req.body);
    const article = await prisma.knowledgeArticle.update({
      where: { id: req.params.id },
      data: input,
      include: { author: { select: { id: true, name: true } } },
    });
    res.json({ article });
  }),
);

adminRouter.delete(
  "/articles/:id",
  asyncHandler(async (req, res) => {
    await prisma.knowledgeArticle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// ---------- Points ledger ----------

adminRouter.get(
  "/points-ledger",
  asyncHandler(async (_req, res) => {
    const entries = await prisma.pointsLedger.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    res.json({ entries });
  }),
);

const createLedgerSchema = z.object({
  userId: z.string().uuid(),
  delta: z.number().int().refine((n) => n !== 0, "delta ne peut pas être 0"),
  reason: z.string().min(2).max(200),
});

adminRouter.post(
  "/points-ledger",
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = createLedgerSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const entry = await tx.pointsLedger.create({
        data: input,
        include: { user: { select: { id: true, name: true } } },
      });
      const updatedUser = await tx.user.update({
        where: { id: input.userId },
        data: { points: { increment: input.delta } },
      });
      if (input.delta > 0) {
        await awardBadges(tx, input.userId, updatedUser.points);
      }
      return entry;
    });

    await recordAudit("admin.points.adjust", req, {
      userId: req.user!.id,
      metadata: { targetUserId: input.userId, delta: input.delta, reason: input.reason },
    });

    res.status(201).json({ entry: result });
  }),
);
