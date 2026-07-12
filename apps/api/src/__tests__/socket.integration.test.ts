import { createServer, Server as HttpServer } from "http";
import { AddressInfo } from "net";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { createSocketServer } from "../lib/socket";
import { prisma } from "../lib/prisma";
import { signAccessToken } from "../lib/jwt";
import * as authService from "../services/auth.service";

/**
 * Exercises the Socket.IO signaling server used for peer-to-peer video
 * calls: auth handshake rejection paths and a successful connection.
 * Requires a reachable database; no-ops otherwise.
 */
let dbAvailable = true;
let httpServer: HttpServer;
let port: number;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbAvailable = false;
    return;
  }

  httpServer = createServer();
  createSocketServer(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  port = (httpServer.address() as AddressInfo).port;
});

afterAll(async () => {
  if (!dbAvailable) return;
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  await prisma.$disconnect();
});

function connect(auth: Record<string, unknown>): Promise<{ socket: ClientSocket; error?: Error }> {
  return new Promise((resolve) => {
    const socket = ioClient(`http://localhost:${port}`, {
      path: "/socket.io",
      auth,
      reconnection: false,
      forceNew: true,
    });
    socket.on("connect", () => resolve({ socket }));
    socket.on("connect_error", (error) => resolve({ socket, error }));
  });
}

describe("Socket.IO signaling server (integration)", () => {
  it("rejects a connection with no token/sessionId", async () => {
    if (!dbAvailable) return;

    const { socket, error } = await connect({});
    expect(error).toBeDefined();
    socket.close();
  });

  it("rejects a connection with an invalid token", async () => {
    if (!dbAvailable) return;

    const { socket, error } = await connect({ token: "garbage", sessionId: "does-not-exist" });
    expect(error).toBeDefined();
    socket.close();
  });

  it("rejects a connection for a session the user is not part of", async () => {
    if (!dbAvailable) return;

    const email = `socket-${Date.now()}@techpapy.dev`;
    const { user } = await authService.register({
      name: "Socket Test",
      email,
      password: "correct-horse-battery",
    });
    const token = signAccessToken({ sub: user.id, role: "USER" });

    const { socket, error } = await connect({ token, sessionId: "00000000-0000-0000-0000-000000000000" });
    expect(error).toBeDefined();
    socket.close();
    await prisma.user.deleteMany({ where: { email } });
  });

  it("accepts a valid connection for a real session participant", async () => {
    if (!dbAvailable) return;

    const suffix = Date.now();
    const emailA = `socket-a-${suffix}@techpapy.dev`;
    const emailB = `socket-b-${suffix}@techpapy.dev`;

    const { user: userA } = await authService.register({
      name: "A",
      email: emailA,
      password: "correct-horse-battery",
    });
    const { user: userB } = await authService.register({
      name: "B",
      email: emailB,
      password: "correct-horse-battery",
    });

    const match = await prisma.match.create({
      data: { userAId: userA.id, userBId: userB.id },
    });
    const session = await prisma.session.create({
      data: { matchId: match.id, scheduledAt: new Date() },
    });

    const token = signAccessToken({ sub: userA.id, role: "USER" });
    const { socket, error } = await connect({ token, sessionId: session.id });
    expect(error).toBeUndefined();
    socket.close();

    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });
});
