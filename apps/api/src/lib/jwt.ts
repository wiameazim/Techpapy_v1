import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../env";

export type AccessTokenPayload = {
  sub: string;
  role: "USER" | "ADMIN";
};

export function signAccessToken(payload: AccessTokenPayload) {
  const options: jwt.SignOptions = {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload & {
    iat: number;
    exp: number;
  };
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate() {
  const days = env.REFRESH_TOKEN_TTL_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
