import { z } from "zod";

export const ALLOWED_FPS = [24, 25, 30, 50, 60];

// Картинки (постер, миниатюра кадра) приходят как data-URL, ограничиваем размер
const dataImage = (maxLength: number) => z.string().startsWith("data:image/", "Ожидается изображение").max(maxLength);

export const createProjectSchema = z.object({
    title: z.string().trim().min(1, "Введите название монтажа").max(120, "Название не длиннее 120 символов"),
    description: z.string().trim().max(1000, "Описание не длиннее 1000 символов").default(""),
    fps: z.coerce.number().refine((value) => ALLOWED_FPS.includes(value), "Недопустимая частота кадров"),
    poster: dataImage(300_000).optional(),
});

export const statusSchema = z.object({
    status: z.enum(["pending", "revision", "approved"], "Недопустимый статус"),
});

export const createCommentSchema = z.object({
    frame: z.number("Укажите номер кадра").int("Номер кадра — целое число").min(0, "Номер кадра не может быть отрицательным"),
    text: z.string().trim().min(1, "Введите текст комментария").max(500, "Комментарий не длиннее 500 символов"),
    thumbnail: dataImage(400_000).optional(),
});

export const resolveSchema = z.object({
    resolved: z.boolean("Укажите resolved: true или false"),
});
