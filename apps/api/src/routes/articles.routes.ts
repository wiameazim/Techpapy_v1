import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../middleware/auth";

export const articlesRouter = Router();

const createSchema = z.object({
  title: z.string().min(3).max(160),
  content: z.string().min(10).max(20000),
});

articlesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.q === "string" ? req.query.q : undefined;
    const articles = await prisma.knowledgeArticle.findMany({
      where: search
        ? {
            OR: [{ title: { contains: search } }, { content: { contains: search } }],
          }
        : undefined,
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ articles });
  }),
);

articlesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: req.params.id },
      include: { author: { select: { id: true, name: true } } },
    });
    if (!article) throw new HttpError(404, "Article not found");
    res.json({ article });
  }),
);

articlesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = createSchema.parse(req.body);
    const article = await prisma.knowledgeArticle.create({
      data: { ...input, authorId: req.user!.id },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json({ article });
  }),
);

articlesRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: req.params.id },
    });
    if (!article) throw new HttpError(404, "Article not found");
    if (article.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new HttpError(403, "Forbidden");
    }
    await prisma.knowledgeArticle.delete({ where: { id: article.id } });
    res.status(204).send();
  }),
);
