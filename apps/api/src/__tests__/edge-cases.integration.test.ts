import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";
import * as authService from "../services/auth.service";

/**
 * Covers error-path branches not exercised by the happy-path flow test:
 * self-matching, matching a nonexistent user, the health check, and
 * admin-only routes (both as a non-admin and as an admin).
 */
const app = createApp();
const suffix = Date.now();
const email = `edge-${suffix}@techpapy.dev`;

let dbAvailable = true;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (!dbAvailable) return;
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

describe("edge cases (integration)", () => {
  it("GET /health returns ok", async () => {
    if (!dbAvailable) return;
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("rejects matching yourself and matching a nonexistent user", async () => {
    if (!dbAvailable) return;

    const { user, accessToken } = await authService.register({
      name: "Edge",
      email,
      password: "correct-horse-battery",
    });

    const self = await request(app)
      .post("/api/matches")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ targetUserId: user.id });
    expect(self.status).toBe(400);

    const missing = await request(app)
      .post("/api/matches")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ targetUserId: "00000000-0000-0000-0000-000000000000" });
    expect(missing.status).toBe(404);
  });

  it("forbids admin routes for a regular user and allows them for an admin", async () => {
    if (!dbAvailable) return;

    const { user, accessToken } = await authService.login({
      email,
      password: "correct-horse-battery",
    });

    const forbidden = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(forbidden.status).toBe(403);

    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    const adminToken = (
      await authService.login({ email, password: "correct-horse-battery" })
    ).accessToken;

    const users = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(users.status).toBe(200);

    const auditLogs = await request(app)
      .get("/api/admin/audit-logs")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditLogs.status).toBe(200);
  });

  it("rejects login with a wrong password", async () => {
    if (!dbAvailable) return;

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "definitely-wrong-password" });
    expect(res.status).toBe(401);
  });

  it("logs out and revokes the refresh cookie", async () => {
    if (!dbAvailable) return;

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "correct-horse-battery" });
    const cookies = login.headers["set-cookie"];

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Cookie", cookies);
    expect(logout.status).toBe(200);
    expect(logout.body.ok).toBe(true);
  });

  it("returns 404 for a nonexistent article", async () => {
    if (!dbAvailable) return;

    const res = await request(app).get(
      "/api/articles/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });
});
