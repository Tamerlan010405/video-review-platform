import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Router, type RequestHandler } from "express";
import multer from "multer";

import { currentUser } from "../auth";
import type { Config } from "../config";
import { forbidden, HttpError, notFound } from "../errors";
import { createProjectSchema, statusSchema } from "../schemas";
import { toProjectDto } from "../serializers";
import type { Store } from "../store";
import type { ProjectRecord } from "../types";

function findProject(store: Store, id: string): ProjectRecord {
    const project = store.data.projects.find((item) => item.id === id);

    if (!project){
        throw notFound("Проект");
    }
    return project;
}

function removeFile(filePath: string): void {
    fs.rm(filePath, { force: true }, () => undefined);
}

export function projectsRouter(store: Store, config: Config): Router {
    const router = Router();

    fs.mkdirSync(config.uploadsDir, { recursive: true });

    const upload = multer({
        storage: multer.diskStorage({
            destination: config.uploadsDir,
            filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname)}`),
        }),
        limits: { fileSize: config.maxUploadBytes, files: 1 },
        fileFilter: (_req, file, callback) => {
            if (!file.mimetype.startsWith("video/")){
                callback(new HttpError(400, "invalid_file", "Файл должен быть видео", "file"));
                return;
            }
            callback(null, true);
        },
    });

    // GET /projects — список с количеством замечаний
    router.get("/", (_req, res) => {
        const items = [...store.data.projects]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((project) => toProjectDto(project, store.data.comments));

        res.json({ items });
    });

    // GET /projects/:id
    router.get("/:id", (req, res) => {
        const project = findProject(store, req.params.id);
        res.json(toProjectDto(project, store.data.comments));
    });

    // POST /projects — multipart/form-data: title, description, fps, poster?, file
    router.post("/", upload.single("file"), (req, res) => {
        const user = currentUser(req);
        const file = req.file;

        try{
            const input = createProjectSchema.parse(req.body);

            if (!file){
                throw new HttpError(400, "validation_error", "Выберите видеофайл", "file");
            }

            const now = new Date().toISOString();
            const project: ProjectRecord = {
                id: `p-${randomUUID().slice(0, 8)}`,
                title: input.title,
                description: input.description,
                fps: input.fps,
                poster: input.poster,
                source: { kind: "file", filename: file.filename, mimeType: file.mimetype },
                status: "pending",
                uploadedBy: user.name,
                uploadedById: user.id,
                createdAt: now,
                history: [{ status: "pending", changedBy: user.name, changedAt: now }],
            };

            store.data.projects.push(project);
            store.save();
            res.status(201).json(toProjectDto(project, store.data.comments));
        }catch(error){
            // Если запрос отклонён, загруженный файл не должен остаться на диске
            if (file){
                removeFile(file.path);
            }
            throw error;
        }
    });

    // PATCH /projects/:id/status — только продюсер
    router.patch("/:id/status", (req, res) => {
        const user = currentUser(req);

        if (user.role !== "producer"){
            throw forbidden("Менять статус может только продюсер");
        }

        const { status } = statusSchema.parse(req.body);
        const project = findProject(store, req.params.id);

        project.status = status;
        project.history.push({ status, changedBy: user.name, changedAt: new Date().toISOString() });
        store.save();

        res.json(toProjectDto(project, store.data.comments));
    });

    // DELETE /projects/:id — продюсер или автор загрузки
    router.delete("/:id", (req, res) => {
        const user = currentUser(req);
        const project = findProject(store, req.params.id);

        if (user.role !== "producer" && project.uploadedById !== user.id){
            throw forbidden("Удалить монтаж может продюсер или его автор");
        }

        if (project.source.kind === "file"){
            removeFile(path.join(config.uploadsDir, project.source.filename));
        }

        store.data.projects = store.data.projects.filter((item) => item.id !== project.id);
        store.data.comments = store.data.comments.filter((comment) => comment.projectId !== project.id);
        store.save();

        res.status(204).end();
    });

    return router;
}

// GET /projects/:id/video открыт без авторизации: тег <video> не умеет слать свои заголовки.
// sendFile сам поддерживает Range-запросы, поэтому перемотка работает без докачки всего файла.
export function videoHandler(store: Store, config: Config): RequestHandler {
    return (req, res, next) => {
        const project = store.data.projects.find((item) => item.id === req.params.id);

        if (!project){
            next(notFound("Проект"));
            return;
        }

        if (project.source.kind === "url"){
            res.redirect(project.source.url);
            return;
        }

        res.sendFile(
            path.join(config.uploadsDir, project.source.filename),
            { headers: { "Content-Type": project.source.mimeType } },
            (error) => {
                if (error && !res.headersSent){
                    next(notFound("Видеофайл"));
                }
            },
        );
    };
}
