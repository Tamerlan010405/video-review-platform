import type { CommentRecord, ProjectRecord, ReviewStatus, StatusChange } from "./types";

export interface ProjectDto {
    id: string;
    title: string;
    description: string;
    fps: number;
    poster?: string;
    videoUrl: string;
    status: ReviewStatus;
    uploadedBy: string;
    createdAt: string;
    history: StatusChange[];
    commentsCount: number;
    openCommentsCount: number;
}

export function toProjectDto(project: ProjectRecord, comments: CommentRecord[]): ProjectDto {
    const projectComments = comments.filter((comment) => comment.projectId === project.id);

    return {
        id: project.id,
        title: project.title,
        description: project.description,
        fps: project.fps,
        poster: project.poster,
        // Для загруженных файлов отдаём свой эндпоинт, для демо-роликов — внешний URL
        videoUrl: project.source.kind === "file" ? `/api/v1/projects/${project.id}/video` : project.source.url,
        status: project.status,
        uploadedBy: project.uploadedBy,
        createdAt: project.createdAt,
        history: project.history,
        commentsCount: projectComments.length,
        openCommentsCount: projectComments.filter((comment) => !comment.resolved).length,
    };
}
