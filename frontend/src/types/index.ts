export type UserRole = "editor" | "reviewer" | "producer";

export type ReviewStatus = "pending" | "revision" | "approved";

export interface User {
    id: string;
    name: string;
    role: UserRole;
}

export interface StatusChange {
    status: ReviewStatus;
    changedBy: string;
    changedAt: string;
}

export interface VideoProject {
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
}

export interface VideoProjectSummary extends VideoProject {
    commentsCount: number;
    openCommentsCount: number;
}

export interface FrameComment {
    id: string;
    projectId: string;
    authorId: string;
    authorName: string;
    frame: number;
    text: string;
    resolved: boolean;
    createdAt: string;
    thumbnail?: string;
}

export interface CreateProjectInput {
    title: string;
    description: string;
    fps: number;
    file: File;
    poster?: string;
}

export interface AddCommentInput {
    projectId: string;
    frame: number;
    text: string;
    thumbnail?: string;
}
