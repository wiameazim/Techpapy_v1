import { NextFunction, Request, Response } from "express";

/**
 * Cookie-authenticated endpoints (refresh/logout) rely on the browser
 * auto-attaching the httpOnly cookie, which a cross-site form post can
 * trigger. Requiring this custom header blocks that: simple cross-site
 * requests cannot set custom headers, only same-origin fetch/XHR can.
 */
export function requireCsrfHeader(req: Request, res: Response, next: NextFunction) {
  if (req.headers["x-requested-with"] !== "XMLHttpRequest") {
    return res.status(403).json({ error: "Missing CSRF header" });
  }
  next();
}
