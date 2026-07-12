import { NextFunction, Request, Response } from "express";
import sanitizeHtml from "sanitize-html";

function clean(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
  }
  if (Array.isArray(value)) {
    return value.map(clean);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, clean(v)]),
    );
  }
  return value;
}

export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query) as typeof req.query;
  if (req.params) req.params = clean(req.params) as typeof req.params;
  next();
}
