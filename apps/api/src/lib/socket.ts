import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { verifyAccessToken } from "./jwt";
import { prisma } from "./prisma";
import { env } from "../env";
import { logger } from "./logger";

type SocketData = { userId: string; sessionId: string };

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const { token, sessionId } = socket.handshake.auth as {
        token?: string;
        sessionId?: string;
      };
      if (!token || !sessionId) {
        return next(new Error("Missing auth"));
      }

      const payload = verifyAccessToken(token);
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { match: true },
      });
      if (!session) return next(new Error("Session not found"));

      const { match } = session;
      if (match.userAId !== payload.sub && match.userBId !== payload.sub) {
        return next(new Error("Forbidden"));
      }

      socket.data.userId = payload.sub;
      socket.data.sessionId = sessionId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { sessionId } = socket.data as SocketData;
    const room = `session:${sessionId}`;
    socket.join(room);

    const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 1;
    logger.info({ sessionId, roomSize }, "video peer connected");
    if (roomSize > 1) {
      socket.to(room).emit("peer-joined");
    }

    socket.on("signal", (data: unknown) => {
      socket.to(room).emit("signal", data);
    });

    socket.on("disconnect", () => {
      socket.to(room).emit("peer-left");
    });
  });

  return io;
}
