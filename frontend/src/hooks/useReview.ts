import { useCallback, useEffect, useState } from "react";

import { addComment, deleteComment, listComments, setCommentResolved } from "../api/comments";
import { getProject, updateProjectStatus } from "../api/projects";
import type { FrameComment, ReviewStatus, VideoProject } from "../types";

function isAbort(error: unknown): boolean {
    return error instanceof DOMException && error.name === "AbortError";
}

export function useReview(projectId: string | undefined){

    const [project, setProject] = useState<VideoProject | null>(null);
    const [comments, setComments] = useState<FrameComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId){
            setError("Проект не найден");
            setIsLoading(false);
            return;
        }

        // Если пользователь ушёл со страницы, незавершённые запросы отменяем
        const controller = new AbortController();

        async function load(id: string){
            setIsLoading(true);
            setError(null);
            try{
                const [loadedProject, loadedComments] = await Promise.all([
                    getProject(id, controller.signal),
                    listComments(id, controller.signal),
                ]);

                setProject(loadedProject);
                setComments(loadedComments);
            }catch(caught){
                if (!isAbort(caught)){
                    setError(caught instanceof Error ? caught.message : "Не удалось загрузить проект");
                }
            }finally{
                if (!controller.signal.aborted){
                    setIsLoading(false);
                }
            }
        }

        void load(projectId);

        return () => controller.abort();
    }, [projectId]);

    const create = useCallback(async (frame: number, text: string, thumbnail?: string) => {
        if (!projectId){
            return;
        }
        const comment = await addComment({ projectId, frame, text, thumbnail });
        setComments((current) => [...current, comment].sort((a, b) => a.frame - b.frame));
    }, [projectId]);

    const toggleResolved = useCallback(async (commentId: string, resolved: boolean) => {
        const updated = await setCommentResolved(commentId, resolved);
        setComments((current) => current.map((comment) => (comment.id === commentId ? updated : comment)));
    }, []);

    const remove = useCallback(async (commentId: string) => {
        await deleteComment(commentId);
        setComments((current) => current.filter((comment) => comment.id !== commentId));
    }, []);

    const changeStatus = useCallback(async (status: ReviewStatus) => {
        if (!projectId){
            return;
        }
        setProject(await updateProjectStatus(projectId, status));
    }, [projectId]);

    return { project, comments, isLoading, error, create, toggleResolved, remove, changeStatus };
}
