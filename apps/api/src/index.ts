// Must be required before any other module to instrument them correctly.
if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@google-cloud/trace-agent").start();
}

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
