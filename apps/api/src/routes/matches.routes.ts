import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const matchesRouter = Router();

matchesRouter.use(requireAuth);

matchesRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const matches = await prisma.match.findMany({
      where: { OR: [{ userAId: req.user!.id }, { userBId: req.user!.id }] },
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

const createSchema = z.object({ targetUserId: z.string().uuid() });

matchesRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { targetUserId } = createSchema.parse(req.body);
    if (targetUserId === req.user!.id) {
      throw new HttpError(400, "Cannot match with yourself");
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new HttpError(404, "User not found");

    const match = await prisma.match.create({
      data: { userAId: req.user!.id, userBId: targetUserId },
    });
    res.status(201).json({ match });
  }),
);
