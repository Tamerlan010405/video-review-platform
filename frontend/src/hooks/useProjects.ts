import { useCallback, useEffect, useState } from "react";

import { deleteProject, listProjects } from "../api/projects";
import type { VideoProjectSummary } from "../types";

export function useProjects(){

    const [projects, setProjects] = useState<VideoProjectSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setError(null);
        try{
            setProjects(await listProjects());
        }catch(caught){
            setError(caught instanceof Error ? caught.message : "Не удалось загрузить проекты");
        }finally{
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const remove = useCallback(async (projectId: string) => {
        await deleteProject(projectId);
        setProjects((current) => current.filter((project) => project.id !== projectId));
    }, []);

    return { projects, isLoading, error, reload, remove };
}
