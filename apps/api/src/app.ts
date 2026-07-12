import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./env";
import { logger } from "./lib/logger";
import { apiRouter } from "./routes";
import { healthRouter } from "./routes/health.routes";
import { metricsRouter } from "./routes/metrics.routes";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { sanitizeInputs } from "./middleware/sanitize";
import { metricsMiddleware } from "./middleware/metrics";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(sanitizeInputs);
  app.use(pinoHttp({ logger }));
  app.use(metricsMiddleware);
  app.use(globalRateLimiter);

  app.use("/health", healthRouter);
  app.use("/metrics", metricsRouter);
  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
