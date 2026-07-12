import { Router } from "express";
import { registry } from "../lib/metrics";

export const metricsRouter = Router();

metricsRouter.get("/", async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.send(await registry.metrics());
});
