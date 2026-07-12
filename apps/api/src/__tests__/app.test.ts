import request from "supertest";
import { createApp } from "../app";

const app = createApp();

describe("app", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not found");
  });

  it("exposes prometheus metrics", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("http_request_duration_seconds");
  });

  it("sets security headers via helmet", async () => {
    const res = await request(app).get("/metrics");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("rejects cookie-authenticated auth endpoints without the CSRF header", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(403);
  });
});
