import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { authRateLimiter } from "../middleware/rateLimiter";
import { requireCsrfHeader } from "../middleware/csrf";
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
} from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, asyncHandler(registerHandler));
authRouter.post("/login", authRateLimiter, asyncHandler(loginHandler));
authRouter.post("/refresh", requireCsrfHeader, asyncHandler(refreshHandler));
authRouter.post("/logout", requireCsrfHeader, asyncHandler(logoutHandler));
