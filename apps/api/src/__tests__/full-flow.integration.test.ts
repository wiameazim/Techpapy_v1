import request from "supertest";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

/**
 * Exercises the full product flow end-to-end against a real database:
 * two users, skills, matching, session scheduling/completion (points +
 * badges), and the knowledge base. Requires a reachable database with
 * migrations applied; no-ops otherwise (see auth.integration.test.ts).
 */
const app = createApp();
const suffix = Date.now();
const userAEmail = `flow-a-${suffix}@techpapy.dev`;
const userBEmail = `flow-b-${suffix}@techpapy.dev`;

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
  await prisma.user.deleteMany({ where: { email: { in: [userAEmail, userBEmail] } } });
  await prisma.$disconnect();
});

describe("full product flow (integration)", () => {
  it("skills -> match -> session -> points -> badge -> article", async () => {
    if (!dbAvailable) return;

    const regA = await request(app)
      .post("/api/auth/register")
      .send({ name: "Flow A", email: userAEmail, password: "correct-horse-battery" });
    expect(regA.status).toBe(201);
    const tokenA = regA.body.accessToken as string;
    const userAId = regA.body.user.id as string;

    const regB = await request(app)
      .post("/api/auth/register")
      .send({ name: "Flow B", email: userBEmail, password: "correct-horse-battery" });
    expect(regB.status).toBe(201);
    const tokenB = regB.body.accessToken as string;
    const userBId = regB.body.user.id as string;

    const skillA = await request(app)
      .post("/api/skills")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Cuisine", type: "WANTED" });
    expect(skillA.status).toBe(201);

    const skillB = await request(app)
      .post("/api/skills")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "Cuisine", type: "OFFERED" });
    expect(skillB.status).toBe(201);

    const skillsList = await request(app).get("/api/skills?type=OFFERED");
    expect(skillsList.status).toBe(200);
    expect(
      skillsList.body.skills.some((s: { userId: string }) => s.userId === userBId),
    ).toBe(true);

    const match = await request(app)
      .post("/api/matches")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ targetUserId: userBId });
    expect(match.status).toBe(201);
    const matchId = match.body.match.id as string;

    const matchesList = await request(app)
      .get("/api/matches")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(matchesList.status).toBe(200);
    expect(matchesList.body.matches.length).toBeGreaterThan(0);

    const session = await request(app)
      .post("/api/sessions")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ matchId, scheduledAt: new Date(Date.now() + 86400000).toISOString() });
    expect(session.status).toBe(201);
    const sessionId = session.body.session.id as string;

    const sessionDetail = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(sessionDetail.status).toBe(200);

    const completed = await request(app)
      .patch(`/api/sessions/${sessionId}/complete`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(completed.status).toBe(200);
    expect(completed.body.session.status).toBe("COMPLETED");

    const meA = await request(app).get("/api/me").set("Authorization", `Bearer ${tokenA}`);
    expect(meA.status).toBe(200);
    expect(meA.body.user.points).toBeGreaterThanOrEqual(1);
    expect(
      meA.body.user.badges.some(
        (b: { badge: { name: string } }) => b.badge.name === "Premier échange",
      ),
    ).toBe(true);

    const pointsHistory = await request(app)
      .get("/api/me/points")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(pointsHistory.status).toBe(200);
    expect(pointsHistory.body.entries.length).toBeGreaterThan(0);

    const badgeCatalogue = await request(app).get("/api/badges");
    expect(badgeCatalogue.status).toBe(200);
    expect(badgeCatalogue.body.badges.length).toBeGreaterThan(0);

    const article = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Astuce visio", content: "Toujours tester sa caméra avant l'appel." });
    expect(article.status).toBe(201);
    const articleId = article.body.article.id as string;

    const articlesList = await request(app).get("/api/articles?q=visio");
    expect(articlesList.status).toBe(200);
    expect(articlesList.body.articles.some((a: { id: string }) => a.id === articleId)).toBe(
      true,
    );

    const deleteForbidden = await request(app)
      .delete(`/api/articles/${articleId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(deleteForbidden.status).toBe(403);

    const deleteOk = await request(app)
      .delete(`/api/articles/${articleId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(deleteOk.status).toBe(204);

    void userAId;
  });
});
