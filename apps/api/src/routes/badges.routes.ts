import { Router } from "express";
import { BADGE_THRESHOLDS } from "../lib/badges";

export const badgesRouter = Router();

badgesRouter.get("/", (_req, res) => {
  res.json({
    badges: BADGE_THRESHOLDS.map((b) => ({
      name: b.name,
      description: b.description,
      pointsRequired: b.points,
    })),
  });
});
