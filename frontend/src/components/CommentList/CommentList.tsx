import { useMemo, useState } from "react";
import { Text } from "@mantine/core";

import type { FrameComment, User } from "../../types";
import { CommentItem } from "../CommentItem/CommentItem";
import classes from "./CommentList.module.css";

type CommentFilter = "all" | "open" | "resolved";

interface CommentListProps {
    comments: FrameComment[];
    fps: number;
    currentFrame: number;
    user: User;
    onSeek: (frame: number) => void;
    onToggleResolved: (commentId: string, resolved: boolean) => void;
    onDelete: (commentId: string) => void;
}

export function CommentList({
    comments,
    fps,
    currentFrame,
    user,
    onSeek,
    onToggleResolved,
    onDelete,
}: CommentListProps){

    const [filter, setFilter] = useState<CommentFilter>("all");

    const openCount = comments.filter((comment) => !comment.resolved).length;

    const visibleComments = useMemo(() => {
        switch(filter){
            case "open":
                return comments.filter((comment) => !comment.resolved);
            case "resolved":
                return comments.filter((comment) => comment.resolved);
            default:
                return comments;
        }
    }, [comments, filter]);

    const tabs: { value: CommentFilter; label: string }[] = [
        { value: "all", label: `Все ${comments.length}` },
        { value: "open", label: `Открытые ${openCount}` },
        { value: "resolved", label: `Решённые ${comments.length - openCount}` },
    ];

    return(
        <div className={classes.Wrapper}>
            <div className={classes.Header}>
                <h2 className={classes.Title}>Замечания</h2>
                <div className={classes.Tabs} role="tablist">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={filter === tab.value}
                            className={`${classes.Tab} ${filter === tab.value ? classes.TabActive : ""}`}
                            onClick={() => setFilter(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={classes.Scroll}>
                {visibleComments.length === 0 ? (
                    <Text className={classes.Empty}>
                        {comments.length === 0
                            ? "Пока нет замечаний. Остановите видео на нужном кадре и напишите комментарий."
                            : "В этом фильтре ничего нет."}
                    </Text>
                ) : (
                    <ul className={classes.List}>
                        {visibleComments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                fps={fps}
                                isActive={comment.frame === currentFrame}
                                canDelete={comment.authorId === user.id || user.role === "producer"}
                                onSeek={onSeek}
                                onToggleResolved={onToggleResolved}
                                onDelete={onDelete}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
