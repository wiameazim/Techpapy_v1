import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { awardBadges } from "../lib/badges";

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

async function assertParticipant(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new HttpError(404, "Match not found");
  if (match.userAId !== userId && match.userBId !== userId) {
    throw new HttpError(403, "Forbidden");
  }
  return match;
}

const createSchema = z.object({
  matchId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
});

sessionsRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = createSchema.parse(req.body);
    await assertParticipant(input.matchId, req.user!.id);

    const session = await prisma.session.create({ data: input });
    res.status(201).json({ session });
  }),
);

sessionsRouter.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        match: {
          include: {
            userA: { select: { id: true, name: true } },
            userB: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!session) throw new HttpError(404, "Session not found");
    const { match } = session;
    if (match.userAId !== req.user!.id && match.userBId !== req.user!.id) {
      throw new HttpError(403, "Forbidden");
    }

    res.json({ session, match });
  }),
);

sessionsRouter.patch(
  "/:id/complete",
  asyncHandler(async (req: AuthedRequest, res) => {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { match: true },
    });
    if (!session) throw new HttpError(404, "Session not found");
    const { match } = session;
    if (match.userAId !== req.user!.id && match.userBId !== req.user!.id) {
      throw new HttpError(403, "Forbidden");
    }

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const completed = await tx.session.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });

      for (const userId of [match.userAId, match.userBId]) {
        await tx.pointsLedger.create({
          data: { userId, delta: 1, reason: "Session d'échange complétée" },
        });
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { points: { increment: 1 } },
        });
        await awardBadges(tx, userId, updatedUser.points);
      }

      return completed;
    });

    res.json({ session: updated });
  }),
);
