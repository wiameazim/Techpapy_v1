import { createServer } from "http";
import { env } from "./env";
import { createApp } from "./app";
import { createSocketServer } from "./lib/socket";
import { logger } from "./lib/logger";

const app = createApp();
const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`);
});
