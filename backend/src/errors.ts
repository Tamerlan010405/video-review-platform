import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

// Единый формат ошибки: { error: { code, message, field? } }
export class HttpError extends Error{
    status: number;
    code: string;
    field?: string;

    constructor(status: number, code: string, message: string, field?: string){
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.code = code;
        this.field = field;
    }
}

export const notFound = (what: string) => new HttpError(404, "not_found", `${what} не найден`);
export const forbidden = (message: string) => new HttpError(403, "forbidden", message);

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof HttpError){
        res.status(error.status).json({ error: { code: error.code, message: error.message, field: error.field } });
        return;
    }

    if (error instanceof ZodError){
        const issue = error.issues[0];
        const field = issue?.path.join(".") || undefined;
        res.status(400).json({
            error: { code: "validation_error", message: issue?.message ?? "Некорректные данные", field },
        });
        return;
    }

    if (error instanceof multer.MulterError){
        const isTooLarge = error.code === "LIMIT_FILE_SIZE";
        res.status(isTooLarge ? 413 : 400).json({
            error: {
                code: isTooLarge ? "file_too_large" : "upload_error",
                message: isTooLarge ? "Файл слишком большой" : "Не удалось принять файл",
                field: error.field,
            },
        });
        return;
    }

    // Некорректный JSON в теле запроса
    if (error instanceof SyntaxError && "body" in error){
        res.status(400).json({ error: { code: "invalid_json", message: "Тело запроса не является корректным JSON" } });
        return;
    }

    console.error(error);
    res.status(500).json({ error: { code: "internal_error", message: "Внутренняя ошибка сервера" } });
};
