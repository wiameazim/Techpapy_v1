import { Router } from "express";
import { authRouter } from "./auth.routes";
import { meRouter } from "./me.routes";
import { skillsRouter } from "./skills.routes";
import { matchesRouter } from "./matches.routes";
import { sessionsRouter } from "./sessions.routes";
import { adminRouter } from "./admin.routes";
import { badgesRouter } from "./badges.routes";
import { articlesRouter } from "./articles.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/me", meRouter);
apiRouter.use("/skills", skillsRouter);
apiRouter.use("/matches", matchesRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/badges", badgesRouter);
apiRouter.use("/articles", articlesRouter);
