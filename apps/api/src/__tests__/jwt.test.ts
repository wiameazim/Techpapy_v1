import { signAccessToken, verifyAccessToken, generateRefreshToken, hashRefreshToken } from "../lib/jwt";

describe("jwt", () => {
  it("signs and verifies an access token round-trip", () => {
    const token = signAccessToken({ sub: "user-1", role: "USER" });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.role).toBe("USER");
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken({ sub: "user-1", role: "USER" });
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow();
  });

  it("generates unique, hashable refresh tokens", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
    expect(hashRefreshToken(a)).toHaveLength(64);
  });
});
