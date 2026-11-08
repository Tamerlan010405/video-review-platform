import type { CommentRecord, ProjectRecord } from "./types";
import type { Store } from "./store";

const DEMO_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

function daysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const DEMO_PROJECTS: ProjectRecord[] = [
    {
        id: "p-demo-1",
        title: "Big Buck Bunny — черновой монтаж v3",
        description: "Демо-ролик для проверки замечаний по кадрам. Обратите внимание на цветокоррекцию в первой сцене.",
        fps: 24,
        source: { kind: "url", url: DEMO_VIDEO_URL },
        status: "revision",
        uploadedBy: "Анна Монтажёрова",
        uploadedById: "u-editor",
        createdAt: daysAgo(3),
        history: [
            { status: "pending", changedBy: "Анна Монтажёрова", changedAt: daysAgo(3) },
            { status: "revision", changedBy: "Мария Продюсерова", changedAt: daysAgo(1) },
        ],
    },
    {
        id: "p-demo-2",
        title: "Рекламный ролик — финальная версия",
        description: "Версия для утверждения. Звук и графика готовы.",
        fps: 24,
        source: { kind: "url", url: DEMO_VIDEO_URL },
        status: "approved",
        uploadedBy: "Анна Монтажёрова",
        uploadedById: "u-editor",
        createdAt: daysAgo(7),
        history: [
            { status: "pending", changedBy: "Анна Монтажёрова", changedAt: daysAgo(7) },
            { status: "approved", changedBy: "Мария Продюсерова", changedAt: daysAgo(5) },
        ],
    },
];

const DEMO_COMMENTS: CommentRecord[] = [
    {
        id: "c-demo-1",
        projectId: "p-demo-1",
        authorId: "u-reviewer",
        authorName: "Илья Ревьюеров",
        frame: 96,
        text: "Резкий переход здесь, добавить небольшую склейку по движению.",
        resolved: false,
        createdAt: daysAgo(2),
    },
    {
        id: "c-demo-2",
        projectId: "p-demo-1",
        authorId: "u-producer",
        authorName: "Мария Продюсерова",
        frame: 312,
        text: "Цвет кожи уходит в жёлтый — поправить баланс белого.",
        resolved: true,
        createdAt: daysAgo(2),
    },
    {
        id: "c-demo-3",
        projectId: "p-demo-1",
        authorId: "u-producer",
        authorName: "Мария Продюсерова",
        frame: 720,
        text: "Титры наезжают на край кадра, нужен отступ.",
        resolved: false,
        createdAt: daysAgo(1),
    },
];

// Демо-данные кладём только в пустую базу
export function seedIfEmpty(store: Store): void {
    if (store.data.projects.length > 0){
        return;
    }
    store.data.projects = DEMO_PROJECTS;
    store.data.comments = DEMO_COMMENTS;
    store.save();
}
