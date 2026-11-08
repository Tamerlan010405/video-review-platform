import type { User } from "./types";

// Демо-пользователи. Настоящая регистрация вне рамок проекта: личность передаётся заголовком X-User-Id
export const USERS: User[] = [
    { id: "u-editor", name: "Анна Монтажёрова", role: "editor" },
    { id: "u-reviewer", name: "Илья Ревьюеров", role: "reviewer" },
    { id: "u-producer", name: "Мария Продюсерова", role: "producer" },
];

export function findUser(id: string | undefined): User | undefined {
    return USERS.find((user) => user.id === id);
}
