const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const API_PREFIX = "/api/v1";

// Бэкенд определяет пользователя по заголовку X-User-Id (демо-авторизация)
let currentUserId: string | null = null;

export function setApiUser(userId: string | null): void {
    currentUserId = userId;
}

export class ApiError extends Error{
    status: number;
    code: string;
    field?: string;

    constructor(message: string, details: { status: number; code: string; field?: string }){
        super(message);
        this.name = "ApiError";
        this.status = details.status;
        this.code = details.code;
        this.field = details.field;
    }
}

interface ErrorBody {
    error?: { code?: string; message?: string; field?: string };
}

async function getResponseBody(response: Response): Promise<unknown> {
    try{
        return await response.json();
    }catch{
        return {};
    }
}

function toApiError(status: number, body: unknown): ApiError {
    const error = (body as ErrorBody)?.error ?? {};

    return new ApiError(error.message ?? `Ошибка запроса: ${status}`, {
        status,
        code: error.code ?? "unknown_error",
        field: error.field,
    });
}

const networkError = () =>
    new ApiError("Нет связи с сервером. Проверьте, что бэкенд запущен.", { status: 0, code: "network_error" });

function authHeaders(): Record<string, string> {
    return currentUserId ? { "X-User-Id": currentUserId } : {};
}

// Относительные пути (например, к загруженному видео) дополняем адресом API
export function resolveUrl(url: string): string {
    return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
}

interface RequestOptions {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { ...authHeaders() };

    if (options.body !== undefined){
        headers["Content-Type"] = "application/json";
    }

    let response: Response;

    try{
        response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
            method: options.method ?? "GET",
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            signal: options.signal,
        });
    }catch(caught){
        // Отмену запроса (AbortController) не маскируем под сетевую ошибку
        if (caught instanceof DOMException && caught.name === "AbortError"){
            throw caught;
        }
        throw networkError();
    }

    if (response.status === 204){
        return undefined as T;
    }

    const body = await getResponseBody(response);

    if (!response.ok){
        throw toApiError(response.status, body);
    }

    return body as T;
}

// fetch не умеет показывать прогресс отправки, поэтому загрузку файла делаем через XMLHttpRequest
export function uploadForm<T>(path: string, formData: FormData, onProgress?: (percent: number) => void): Promise<T> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", `${API_BASE_URL}${API_PREFIX}${path}`);
        Object.entries(authHeaders()).forEach(([name, value]) => xhr.setRequestHeader(name, value));

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable){
                onProgress?.(Math.round((event.loaded / event.total) * 100));
            }
        };
        xhr.onerror = () => reject(networkError());
        xhr.onload = () => {
            let body: unknown = {};

            try{
                body = JSON.parse(xhr.responseText);
            }catch{
                // пустой или не-JSON ответ — тело останется пустым объектом
            }

            if (xhr.status >= 200 && xhr.status < 300){
                resolve(body as T);
            }else{
                reject(toApiError(xhr.status, body));
            }
        };

        xhr.send(formData);
    });
}
