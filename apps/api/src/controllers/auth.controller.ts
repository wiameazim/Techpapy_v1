import { Request, Response } from "express";
import { z } from "zod";
import { env } from "../env";
import { recordAudit } from "../lib/audit";
import { authFailuresTotal } from "../lib/metrics";
import * as authService from "../services/auth.service";

const REFRESH_COOKIE = "refreshToken";

const isProduction = env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // Frontend and API are deployed on different subdomains in production
  // (e.g. Cloud Run), so the cookie must be sendable cross-site. This is
  // safe because it requires Secure, and CORS + the X-Requested-With
  // guard already block cross-origin abuse of the cookie-authenticated
  // routes.
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/api/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerHandler(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.register(input);

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  await recordAudit("auth.register", req, { userId: user.id });

  res.status(201).json({ accessToken, user: authService.toPublicUser(user) });
}

export async function loginHandler(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);

  try {
    const { user, accessToken, refreshToken } = await authService.login(input);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    await recordAudit("auth.login.success", req, { userId: user.id });
    res.json({ accessToken, user: authService.toPublicUser(user) });
  } catch (err) {
    authFailuresTotal.inc();
    await recordAudit("auth.login.failure", req, { metadata: { email: input.email } });
    throw err;
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE];
  if (!rawToken) return res.status(401).json({ error: "Missing refresh token" });

  const { user, accessToken, refreshToken } = await authService.rotateRefreshToken(rawToken);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json({ accessToken, user: authService.toPublicUser(user) });
}

export async function logoutHandler(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE];
  if (rawToken) await authService.revokeRefreshToken(rawToken);

  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  await recordAudit("auth.logout", req);
  res.json({ ok: true });
}
