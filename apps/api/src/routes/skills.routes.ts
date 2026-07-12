import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const skillsRouter = Router();

const createSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(["OFFERED", "WANTED"]),
});

skillsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const type = z.enum(["OFFERED", "WANTED"]).optional().parse(req.query.type);
    const skills = await prisma.skill.findMany({
      where: type ? { type } : undefined,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ skills });
  }),
);

skillsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = createSchema.parse(req.body);
    const skill = await prisma.skill.create({
      data: { ...input, userId: req.user!.id },
    });
    res.status(201).json({ skill });
  }),
);

skillsRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const skill = await prisma.skill.findUnique({ where: { id: req.params.id } });
    if (!skill) throw new HttpError(404, "Skill not found");
    if (skill.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new HttpError(403, "Forbidden");
    }
    await prisma.skill.delete({ where: { id: skill.id } });
    res.status(204).send();
  }),
);
