import assert from "node:assert/strict";
import fs from "node:fs";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import { seedIfEmpty } from "../src/seed";
import { Store } from "../src/store";

let baseUrl = "";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
let dataDir = "";

const EDITOR = "u-editor";
const REVIEWER = "u-reviewer";
const PRODUCER = "u-producer";

async function call(method: string, url: string, userId?: string, body?: unknown) {
    const response = await fetch(`${baseUrl}/api/v1${url}`, {
        method,
        headers: {
            ...(userId ? { "X-User-Id": userId } : {}),
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();

    return { status: response.status, body: text ? JSON.parse(text) : null };
}

before(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "vrp-test-"));
    const store = new Store(null);
    seedIfEmpty(store);
    server = createApp(store, loadConfig({ dataDir, uploadsDir: path.join(dataDir, "uploads") })).listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
    server.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

describe("авторизация", () => {
    it("без заголовка X-User-Id отвечает 401", async () => {
        const { status, body } = await call("GET", "/projects");
        assert.equal(status, 401);
        assert.equal(body.error.code, "unauthorized");
    });

    it("health доступен без авторизации", async () => {
        const { status } = await call("GET", "/health");
        assert.equal(status, 200);
    });
});

describe("проекты", () => {
    it("возвращает список с количеством замечаний", async () => {
        const { status, body } = await call("GET", "/projects", EDITOR);
        assert.equal(status, 200);
        const demo = body.items.find((item: { id: string }) => item.id === "p-demo-1");
        assert.equal(demo.commentsCount, 3);
        assert.equal(demo.openCommentsCount, 2);
    });

    it("404 для несуществующего проекта", async () => {
        const { status, body } = await call("GET", "/projects/nope", EDITOR);
        assert.equal(status, 404);
        assert.equal(body.error.code, "not_found");
    });

    it("менять статус может только продюсер", async () => {
        const denied = await call("PATCH", "/projects/p-demo-1/status", REVIEWER, { status: "approved" });
        assert.equal(denied.status, 403);

        const allowed = await call("PATCH", "/projects/p-demo-1/status", PRODUCER, { status: "approved" });
        assert.equal(allowed.status, 200);
        assert.equal(allowed.body.status, "approved");
        assert.equal(allowed.body.history.at(-1).changedBy, "Мария Продюсерова");
    });

    it("отклоняет недопустимый статус с кодом 400", async () => {
        const { status, body } = await call("PATCH", "/projects/p-demo-1/status", PRODUCER, { status: "done" });
        assert.equal(status, 400);
        assert.equal(body.error.code, "validation_error");
    });

    it("загружает видео, отдаёт его с поддержкой Range и удаляет", async () => {
        const form = new FormData();
        form.set("title", "Тестовый ролик");
        form.set("fps", "25");
        form.set("file", new Blob([Buffer.alloc(2048, 1)], { type: "video/mp4" }), "clip.mp4");

        const created = await fetch(`${baseUrl}/api/v1/projects`, { method: "POST", headers: { "X-User-Id": EDITOR }, body: form });
        assert.equal(created.status, 201);
        const project = (await created.json()) as { id: string; status: string; videoUrl: string };
        assert.equal(project.status, "pending");
        assert.equal(project.videoUrl, `/api/v1/projects/${project.id}/video`);

        const partial = await fetch(`${baseUrl}${project.videoUrl}`, { headers: { Range: "bytes=0-99" } });
        assert.equal(partial.status, 206);
        assert.equal((await partial.arrayBuffer()).byteLength, 100);

        const removed = await call("DELETE", `/projects/${project.id}`, EDITOR);
        assert.equal(removed.status, 204);
        assert.equal((await call("GET", `/projects/${project.id}`, EDITOR)).status, 404);
    });

    it("не принимает файл, который не является видео", async () => {
        const form = new FormData();
        form.set("title", "Не видео");
        form.set("fps", "25");
        form.set("file", new Blob(["text"], { type: "text/plain" }), "a.txt");

        const response = await fetch(`${baseUrl}/api/v1/projects`, { method: "POST", headers: { "X-User-Id": EDITOR }, body: form });
        assert.equal(response.status, 400);
        const body = (await response.json()) as { error: { code: string } };
        assert.equal(body.error.code, "invalid_file");
    });
});

describe("комментарии", () => {
    it("создаёт, отмечает исправленным и удаляет комментарий", async () => {
        const created = await call("POST", "/projects/p-demo-2/comments", REVIEWER, { frame: 42, text: "  Проверить звук  " });
        assert.equal(created.status, 201);
        assert.equal(created.body.text, "Проверить звук");
        assert.equal(created.body.authorName, "Илья Ревьюеров");

        const resolved = await call("PATCH", `/comments/${created.body.id}`, EDITOR, { resolved: true });
        assert.equal(resolved.body.resolved, true);

        const foreignDelete = await call("DELETE", `/comments/${created.body.id}`, EDITOR);
        assert.equal(foreignDelete.status, 403);

        const ownDelete = await call("DELETE", `/comments/${created.body.id}`, REVIEWER);
        assert.equal(ownDelete.status, 204);
    });

    it("валидирует комментарий", async () => {
        const empty = await call("POST", "/projects/p-demo-2/comments", REVIEWER, { frame: 1, text: "   " });
        assert.equal(empty.status, 400);
        assert.equal(empty.body.error.field, "text");

        const negative = await call("POST", "/projects/p-demo-2/comments", REVIEWER, { frame: -5, text: "x" });
        assert.equal(negative.status, 400);
        assert.equal(negative.body.error.field, "frame");
    });
});
