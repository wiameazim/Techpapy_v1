import { NextFunction, Request, Response } from "express";
import { httpRequestDuration, httpRequestsTotal } from "../lib/metrics";

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.observe(labels, seconds);
    httpRequestsTotal.inc(labels);
  });

  next();
}
