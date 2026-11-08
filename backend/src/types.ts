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

export type VideoSource =
    | { kind: "file"; filename: string; mimeType: string }
    | { kind: "url"; url: string };

export interface ProjectRecord {
    id: string;
    title: string;
    description: string;
    fps: number;
    poster?: string;
    source: VideoSource;
    status: ReviewStatus;
    uploadedBy: string;
    uploadedById: string;
    createdAt: string;
    history: StatusChange[];
}

export interface CommentRecord {
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

export interface Database {
    projects: ProjectRecord[];
    comments: CommentRecord[];
}
