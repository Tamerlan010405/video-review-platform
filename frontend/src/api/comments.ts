import type { AddCommentInput, FrameComment } from "../types";
import { request } from "./client";

export async function listComments(projectId: string, signal?: AbortSignal): Promise<FrameComment[]> {
    const { items } = await request<{ items: FrameComment[] }>(`/projects/${projectId}/comments`, { signal });
    return items;
}

export function addComment({ projectId, frame, text, thumbnail }: AddCommentInput): Promise<FrameComment> {
    return request<FrameComment>(`/projects/${projectId}/comments`, {
        method: "POST",
        body: { frame, text, thumbnail },
    });
}

export function setCommentResolved(commentId: string, resolved: boolean): Promise<FrameComment> {
    return request<FrameComment>(`/comments/${commentId}`, { method: "PATCH", body: { resolved } });
}

export function deleteComment(commentId: string): Promise<void> {
    return request<void>(`/comments/${commentId}`, { method: "DELETE" });
}
