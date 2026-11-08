import cors from "cors";
import express from "express";

import { authenticate } from "./auth";
import type { Config } from "./config";
import { errorHandler, HttpError } from "./errors";
import { commentsRouter, projectCommentsRouter } from "./routes/comments";
import { projectsRouter, videoHandler } from "./routes/projects";
import type { Store } from "./store";

export function createApp(store: Store, config: Config){
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: "2mb" }));

    app.get("/api/v1/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    // Видео отдаём до проверки авторизации — см. комментарий у videoHandler
    app.get("/api/v1/projects/:id/video", videoHandler(store, config));

    const api = express.Router();
    api.use(authenticate);
    api.use("/projects", projectsRouter(store, config));
    api.use("/projects/:id/comments", projectCommentsRouter(store));
    api.use("/comments", commentsRouter(store));
    app.use("/api/v1", api);

    app.use((_req, _res, next) => next(new HttpError(404, "not_found", "Маршрут не найден")));
    app.use(errorHandler);

    return app;
}
