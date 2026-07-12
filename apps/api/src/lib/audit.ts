import { Request } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { logger } from "./logger";

export async function recordAudit(
  action: string,
  req: Request,
  opts: { userId?: string; metadata?: Record<string, unknown> } = {},
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: opts.userId,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: opts.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.error({ err, action }, "failed to write audit log");
  }
}
