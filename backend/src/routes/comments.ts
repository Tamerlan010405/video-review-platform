import { randomUUID } from "node:crypto";
import { Router } from "express";

import { currentUser } from "../auth";
import { forbidden, notFound } from "../errors";
import { createCommentSchema, resolveSchema } from "../schemas";
import type { Store } from "../store";
import type { CommentRecord } from "../types";

function findComment(store: Store, id: string): CommentRecord {
    const comment = store.data.comments.find((item) => item.id === id);

    if (!comment){
        throw notFound("Комментарий");
    }
    return comment;
}

// Комментарии вложены в проект: /projects/:id/comments
export function projectCommentsRouter(store: Store): Router {
    const router = Router({ mergeParams: true });

    router.get("/", (req, res) => {
        const projectId = (req.params as Record<string, string>).id;

        if (!store.data.projects.some((project) => project.id === projectId)){
            throw notFound("Проект");
        }

        const items = store.data.comments
            .filter((comment) => comment.projectId === projectId)
            .sort((a, b) => a.frame - b.frame || a.createdAt.localeCompare(b.createdAt));

        res.json({ items });
    });

    router.post("/", (req, res) => {
        const user = currentUser(req);
        const projectId = (req.params as Record<string, string>).id;

        if (!store.data.projects.some((project) => project.id === projectId)){
            throw notFound("Проект");
        }

        const input = createCommentSchema.parse(req.body);
        const comment: CommentRecord = {
            id: `c-${randomUUID().slice(0, 8)}`,
            projectId,
            authorId: user.id,
            authorName: user.name,
            frame: input.frame,
            text: input.text,
            resolved: false,
            createdAt: new Date().toISOString(),
            thumbnail: input.thumbnail,
        };

        store.data.comments.push(comment);
        store.save();
        res.status(201).json(comment);
    });

    return router;
}

// Операции над конкретным комментарием: /comments/:id
export function commentsRouter(store: Store): Router {
    const router = Router();

    router.patch("/:id", (req, res) => {
        const { resolved } = resolveSchema.parse(req.body);
        const comment = findComment(store, req.params.id);

        comment.resolved = resolved;
        store.save();
        res.json(comment);
    });

    router.delete("/:id", (req, res) => {
        const user = currentUser(req);
        const comment = findComment(store, req.params.id);

        if (comment.authorId !== user.id && user.role !== "producer"){
            throw forbidden("Удалить можно только свой комментарий");
        }

        store.data.comments = store.data.comments.filter((item) => item.id !== comment.id);
        store.save();
        res.status(204).end();
    });

    return router;
}
