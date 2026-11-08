import type { Request, RequestHandler } from "express";

import { HttpError } from "./errors";
import type { User } from "./types";
import { findUser } from "./users";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

// Определяем пользователя по заголовку X-User-Id. Нет заголовка или неизвестный id — 401
export const authenticate: RequestHandler = (req, _res, next) => {
    const user = findUser(req.header("X-User-Id"));

    if (!user){
        next(new HttpError(401, "unauthorized", "Требуется авторизация"));
        return;
    }

    req.user = user;
    next();
};

export function currentUser(req: Request): User {
    if (!req.user){
        throw new HttpError(401, "unauthorized", "Требуется авторизация");
    }
    return req.user;
}
