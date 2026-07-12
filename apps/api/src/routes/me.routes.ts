import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const meRouter = Router();

meRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        badges: { include: { badge: true } },
        skills: true,
      },
    });
    res.json({ user });
  }),
);

meRouter.get(
  "/points",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const entries = await prisma.pointsLedger.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ entries });
  }),
);
