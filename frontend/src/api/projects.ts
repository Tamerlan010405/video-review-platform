import type { CreateProjectInput, ReviewStatus, VideoProject, VideoProjectSummary } from "../types";
import { request, resolveUrl, uploadForm } from "./client";

function withAbsoluteVideoUrl<T extends VideoProject>(project: T): T {
    return { ...project, videoUrl: resolveUrl(project.videoUrl) };
}

export async function listProjects(signal?: AbortSignal): Promise<VideoProjectSummary[]> {
    const { items } = await request<{ items: VideoProjectSummary[] }>("/projects", { signal });
    return items.map(withAbsoluteVideoUrl);
}

export async function getProject(projectId: string, signal?: AbortSignal): Promise<VideoProject> {
    return withAbsoluteVideoUrl(await request<VideoProject>(`/projects/${projectId}`, { signal }));
}

export async function createProject(
    input: CreateProjectInput,
    onProgress?: (percent: number) => void,
): Promise<VideoProject> {
    const formData = new FormData();

    formData.set("title", input.title.trim());
    formData.set("description", input.description.trim());
    formData.set("fps", String(input.fps));
    if (input.poster){
        formData.set("poster", input.poster);
    }
    // Файл кладём последним: так сервер сначала получает текстовые поля
    formData.set("file", input.file);

    return withAbsoluteVideoUrl(await uploadForm<VideoProject>("/projects", formData, onProgress));
}

export async function updateProjectStatus(projectId: string, status: ReviewStatus): Promise<VideoProject> {
    return withAbsoluteVideoUrl(
        await request<VideoProject>(`/projects/${projectId}/status`, { method: "PATCH", body: { status } }),
    );
}

export function deleteProject(projectId: string): Promise<void> {
    return request<void>(`/projects/${projectId}`, { method: "DELETE" });
}
