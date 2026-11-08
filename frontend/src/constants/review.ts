import type { ReviewStatus, User, UserRole } from "../types";

export const STATUS_META: Record<ReviewStatus, { label: string }> = {
    pending: { label: "На проверке" },
    revision: { label: "На правках" },
    approved: { label: "Принято" },
};

export const STATUS_ORDER: ReviewStatus[] = ["pending", "revision", "approved"];

export const ROLE_LABELS: Record<UserRole, string> = {
    editor: "Монтажёр",
    reviewer: "Ревьюер",
    producer: "Продюсер",
};

export const USERS: User[] = [
    { id: "u-editor", name: "Анна Монтажёрова", role: "editor" },
    { id: "u-reviewer", name: "Илья Ревьюеров", role: "reviewer" },
    { id: "u-producer", name: "Мария Продюсерова", role: "producer" },
];

export const FPS_OPTIONS = ["24", "25", "30", "50", "60"];

export const DEFAULT_FPS = 25;

export const MAX_FILE_SIZE_MB = 500;

export const PLAYBACK_RATES = ["0.5", "1", "1.5", "2"];
