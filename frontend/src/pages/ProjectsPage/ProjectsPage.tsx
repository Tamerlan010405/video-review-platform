import { useMemo, useState } from "react";
import { Alert, Button, Group, Modal, Skeleton, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";

import { ProjectTable } from "../../components/ProjectTable/ProjectTable";
import { UploadModal } from "../../components/UploadModal/UploadModal";
import { STATUS_META, STATUS_ORDER } from "../../constants/review";
import { useCurrentUser } from "../../context/UserContext";
import { useProjects } from "../../hooks/useProjects";
import type { ReviewStatus, VideoProject } from "../../types";
import classes from "./ProjectsPage.module.css";

type StatusFilter = "all" | ReviewStatus;

export function ProjectsPage(){

    const navigate = useNavigate();
    const { user } = useCurrentUser();
    const { projects, isLoading, error, reload, remove } = useProjects();

    const [uploadOpened, { open: openUpload, close: closeUpload }] = useDisclosure(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const counts = useMemo(() => {
        const result: Record<StatusFilter, number> = { all: projects.length, pending: 0, revision: 0, approved: 0 };
        projects.forEach((project) => {
            result[project.status] += 1;
        });
        return result;
    }, [projects]);

    const visibleProjects = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return projects.filter((project) => {
            const matchesStatus = statusFilter === "all" || project.status === statusFilter;
            const matchesQuery = query === "" || project.title.toLowerCase().includes(query);
            return matchesStatus && matchesQuery;
        });
    }, [projects, statusFilter, searchQuery]);

    const projectToDelete = projects.find((project) => project.id === projectToDeleteId);

    const tabs: { value: StatusFilter; label: string }[] = [
        { value: "all", label: "Все" },
        ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS_META[status].label })),
    ];

    function handleCreated(project: VideoProject){
        closeUpload();
        notifications.show({ color: "dark", message: "Монтаж загружен" });
        navigate(`/projects/${project.id}`);
    }

    async function handleDeleteConfirm(){
        if (!projectToDeleteId){
            return;
        }

        setIsDeleting(true);
        try{
            await remove(projectToDeleteId);
            setProjectToDeleteId(null);
            notifications.show({ color: "dark", message: "Проект удалён" });
        }catch(caught){
            notifications.show({
                color: "brand",
                title: "Не удалось удалить проект",
                message: caught instanceof Error ? caught.message : "Неизвестная ошибка",
            });
        }finally{
            setIsDeleting(false);
        }
    }

    function renderContent(){
        if (isLoading){
            return(
                <Stack gap={1}>
                    {[0, 1, 2].map((index) => (
                        <Skeleton key={index} height={102} radius={0} />
                    ))}
                </Stack>
            );
        }

        if (error){
            return(
                <Alert color="brand" variant="light" title="Ошибка загрузки">
                    <Text mb={12}>{error}</Text>
                    <Button variant="default" onClick={() => void reload()}>
                        Повторить
                    </Button>
                </Alert>
            );
        }

        if (visibleProjects.length === 0){
            return(
                <div className={classes.Empty}>
                    <Text className={classes.EmptyTitle}>
                        {projects.length === 0 ? "Пока нет ни одного монтажа" : "Ничего не найдено"}
                    </Text>
                    <Text className={classes.EmptyText}>
                        {projects.length === 0
                            ? "Загрузите черновой монтаж, чтобы команда могла оставить замечания по кадрам."
                            : "Измените фильтр или поисковый запрос."}
                    </Text>
                </div>
            );
        }

        return <ProjectTable projects={visibleProjects} user={user} onDelete={setProjectToDeleteId} />;
    }

    return(
        <div className={`${classes.Page} vrp-rise`}>
            <header className={classes.Intro}>
                <h1 className={classes.Title}>Монтажи</h1>
                <div className={classes.Aside}>
                    <p className={classes.Lead}>
                        Загрузите черновик. Команда оставит замечания по кадрам, продюсер примет решение.
                    </p>
                    <Button onClick={openUpload}>Загрузить монтаж</Button>
                </div>
            </header>

            <div className={classes.Toolbar}>
                <div className={classes.Tabs} role="tablist" aria-label="Фильтр по статусу">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={statusFilter === tab.value}
                            className={`${classes.Tab} ${statusFilter === tab.value ? classes.TabActive : ""}`}
                            onClick={() => setStatusFilter(tab.value)}
                        >
                            {tab.label}
                            <span className={classes.Count}>{counts[tab.value]}</span>
                        </button>
                    ))}
                </div>

                <div className={classes.SearchBox}>
                    <svg
                        className={classes.SearchIcon}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <circle cx="11" cy="11" r="6.5" />
                        <path d="M16 16l4.5 4.5" />
                    </svg>
                    <input
                        className={classes.Search}
                        type="search"
                        placeholder="Поиск по названию"
                        aria-label="Поиск по названию"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.currentTarget.value)}
                    />
                </div>
            </div>

            <div className={classes.Content}>{renderContent()}</div>

            <UploadModal opened={uploadOpened} onClose={closeUpload} onCreated={handleCreated} />

            <Modal
                opened={projectToDeleteId !== null}
                onClose={() => !isDeleting && setProjectToDeleteId(null)}
                title="Удалить проект?"
                centered
            >
                <Text mb={24}>
                    «{projectToDelete?.title}» и все замечания к нему будут удалены без возможности восстановления.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setProjectToDeleteId(null)} disabled={isDeleting}>
                        Отмена
                    </Button>
                    <Button onClick={handleDeleteConfirm} loading={isDeleting}>
                        Удалить
                    </Button>
                </Group>
            </Modal>
        </div>
    );
}
