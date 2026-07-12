import { Request, Response } from "express";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth";
import { errorHandler, HttpError, notFoundHandler } from "../middleware/errorHandler";
import { sanitizeInputs } from "../middleware/sanitize";
import { signAccessToken } from "../lib/jwt";
import { z } from "zod";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("requireAuth middleware", () => {
  it("rejects requests without an Authorization header", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req as AuthedRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid access token", () => {
    const req = { headers: { authorization: "Bearer garbage" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req as AuthedRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("accepts a valid access token and attaches the user", () => {
    const token = signAccessToken({ sub: "user-1", role: "USER" });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req as AuthedRequest, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as AuthedRequest).user).toEqual({ id: "user-1", role: "USER" });
  });
});

describe("requireRole middleware", () => {
  it("forbids a user without the required role", () => {
    const req = { user: { id: "u1", role: "USER" } } as AuthedRequest;
    const res = mockRes();
    const next = jest.fn();

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a user with the required role", () => {
    const req = { user: { id: "u1", role: "ADMIN" } } as AuthedRequest;
    const res = mockRes();
    const next = jest.fn();

    requireRole("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe("errorHandler middleware", () => {
  it("formats ZodError as a 400 with issues", () => {
    const res = mockRes();
    let zodError: z.ZodError;
    try {
      z.object({ name: z.string() }).parse({});
      throw new Error("unreachable");
    } catch (e) {
      zodError = e as z.ZodError;
    }

    errorHandler(zodError, {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("formats HttpError with its own status code", () => {
    const res = mockRes();
    errorHandler(new HttpError(404, "Not found"), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("falls back to 500 for unknown errors", () => {
    const res = mockRes();
    errorHandler(new Error("boom"), { path: "/x" } as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("notFoundHandler responds 404", () => {
    const res = mockRes();
    notFoundHandler({} as Request, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("sanitizeInputs middleware", () => {
  it("strips HTML from nested arrays and objects", () => {
    const req = {
      body: {
        name: "<script>alert(1)</script>Bob",
        tags: ["<b>a</b>", "<i>b</i>"],
        nested: { bio: "<img src=x>hello" },
      },
      query: {},
      params: {},
    } as unknown as Request;
    const next = jest.fn();

    sanitizeInputs(req, {} as Response, next);

    expect(req.body.name).toBe("Bob");
    expect(req.body.tags).toEqual(["a", "b"]);
    expect(req.body.nested.bio).toBe("hello");
    expect(next).toHaveBeenCalled();
  });
});
