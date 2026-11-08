import { Alert, Button, Skeleton, Text } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Link, useParams } from "react-router";

import { CommentForm } from "../../components/CommentForm/CommentForm";
import { CommentList } from "../../components/CommentList/CommentList";
import { StatusControl } from "../../components/StatusControl/StatusControl";
import { VideoPlayer } from "../../components/VideoPlayer/VideoPlayer";
import { useCurrentUser } from "../../context/UserContext";
import { useReview } from "../../hooks/useReview";
import { useVideoPlayer } from "../../hooks/useVideoPlayer";
import type { FrameComment, User, VideoProject } from "../../types";
import { captureFrame } from "../../utils/captureFrame";
import classes from "./ReviewPage.module.css";

interface ReviewWorkspaceProps {
    project: VideoProject;
    videoUrl: string;
    comments: FrameComment[];
    user: User;
    onCreate: (frame: number, text: string, thumbnail?: string) => Promise<void>;
    onToggleResolved: (commentId: string, resolved: boolean) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
}

function showError(title: string, caught: unknown){
    notifications.show({
        color: "brand",
        title,
        message: caught instanceof Error ? caught.message : "Неизвестная ошибка",
    });
}

// Рабочая область монтируется только когда видео уже готово — так хук плеера сразу видит <video>
function ReviewWorkspace({
    project,
    videoUrl,
    comments,
    user,
    onCreate,
    onToggleResolved,
    onDelete,
}: ReviewWorkspaceProps){

    const player = useVideoPlayer(project.fps);

    useHotkeys([
        ["space", (event) => { event.preventDefault(); player.togglePlay(); }],
        ["ArrowLeft", () => player.stepFrames(-1)],
        ["ArrowRight", () => player.stepFrames(1)],
        ["shift+ArrowLeft", () => player.stepFrames(-Math.round(project.fps))],
        ["shift+ArrowRight", () => player.stepFrames(Math.round(project.fps))],
    ]);

    async function handleCreate(text: string){
        const frame = player.currentFrame;
        const thumbnail = captureFrame(player.videoRef.current);

        try{
            await onCreate(frame, text, thumbnail);
        }catch(caught){
            showError("Не удалось добавить комментарий", caught);
            throw caught;
        }
    }

    async function handleToggleResolved(commentId: string, resolved: boolean){
        try{
            await onToggleResolved(commentId, resolved);
        }catch(caught){
            showError("Не удалось обновить комментарий", caught);
        }
    }

    async function handleDelete(commentId: string){
        try{
            await onDelete(commentId);
        }catch(caught){
            showError("Не удалось удалить комментарий", caught);
        }
    }

    return(
        <>
            <section className={classes.Stage}>
                <VideoPlayer src={videoUrl} fps={project.fps} comments={comments} player={player} />
            </section>

            <aside className={classes.Panel}>
                <CommentList
                    comments={comments}
                    fps={project.fps}
                    currentFrame={player.currentFrame}
                    user={user}
                    onSeek={(frame) => {
                        player.pause();
                        player.seekToFrame(frame);
                    }}
                    onToggleResolved={handleToggleResolved}
                    onDelete={handleDelete}
                />
                <CommentForm
                    currentFrame={player.currentFrame}
                    fps={project.fps}
                    onFocus={player.pause}
                    onSubmit={handleCreate}
                />
            </aside>
        </>
    );
}

export function ReviewPage(){

    const { projectId } = useParams();
    const { user } = useCurrentUser();
    const review = useReview(projectId);

    const { project, comments } = review;
    const videoUrl = project?.videoUrl ?? null;
    const openCommentsCount = comments.filter((comment) => !comment.resolved).length;
    const isReady = !review.isLoading && project !== null && videoUrl !== null;

    return(
        <div className={`${classes.Workspace} vrp-rise`}>
            <header className={classes.Topbar}>
                <div className={classes.TopLeft}>
                    <Link to="/projects" className={classes.Back}>← Монтажи</Link>
                    <div className={classes.TitleBlock}>
                        <h1 className={classes.Title}>{project?.title ?? "Загрузка…"}</h1>
                        {project?.description && <Text className={classes.Description} lineClamp={1}>{project.description}</Text>}
                    </div>
                </div>

                {project && (
                    <StatusControl
                        status={project.status}
                        history={project.history}
                        user={user}
                        openCommentsCount={openCommentsCount}
                        onChange={review.changeStatus}
                    />
                )}
            </header>

            <div className={classes.Body}>
                {review.isLoading && (
                    <>
                        <Skeleton className={classes.Stage} radius={0} />
                        <Skeleton className={classes.Panel} radius={0} />
                    </>
                )}

                {!review.isLoading && !isReady && (
                    <div className={classes.Error}>
                        <Alert color="brand" variant="light" title="Не удалось открыть монтаж">
                            <Text mb={12}>{review.error ?? "Проект не найден"}</Text>
                            <Button component={Link} to="/projects" variant="default">
                                Вернуться к списку
                            </Button>
                        </Alert>
                    </div>
                )}

                {isReady && (
                    <ReviewWorkspace
                        project={project}
                        videoUrl={videoUrl}
                        comments={comments}
                        user={user}
                        onCreate={review.create}
                        onToggleResolved={review.toggleResolved}
                        onDelete={review.remove}
                    />
                )}
            </div>
        </div>
    );
}
