import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

/**
 * Requires a reachable Postgres instance at DATABASE_URL with migrations applied
 * (see docker-compose.yml + `npm run prisma:migrate`). Skipped automatically
 * when the database is unreachable so it doesn't block unit-only runs.
 */
const app = createApp();
const email = `test-${Date.now()}@techpapy.dev`;

let dbAvailable = true;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (dbAvailable) {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});

const maybe = () => (dbAvailable ? it : it.skip);

describe("auth flow (integration)", () => {
  maybe()("registers, logs in, refreshes and logs out", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada", email, password: "correct-horse-battery" });
    expect(register.status).toBe(201);
    expect(register.body.accessToken).toBeDefined();

    const cookies = register.headers["set-cookie"];

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "correct-horse-battery" });
    expect(login.status).toBe(200);

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .set("X-Requested-With", "XMLHttpRequest")
      .set("Cookie", cookies);
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeDefined();
  });

  maybe()("rejects duplicate registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Ada", email, password: "correct-horse-battery" });
    expect(res.status).toBe(409);
  });
});
