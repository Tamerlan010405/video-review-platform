import type { FrameComment } from "../../types";
import { formatDateTime } from "../../utils/format";
import { formatTimecode } from "../../utils/timecode";
import classes from "./CommentItem.module.css";

interface CommentItemProps {
    comment: FrameComment;
    fps: number;
    isActive: boolean;
    canDelete: boolean;
    onSeek: (frame: number) => void;
    onToggleResolved: (commentId: string, resolved: boolean) => void;
    onDelete: (commentId: string) => void;
}

export function CommentItem({
    comment,
    fps,
    isActive,
    canDelete,
    onSeek,
    onToggleResolved,
    onDelete,
}: CommentItemProps){

    const rootClass = [
        classes.Item,
        isActive ? classes.Active : "",
        comment.resolved ? classes.Resolved : "",
    ].join(" ");

    return(
        <li className={rootClass}>
            <div className={classes.Meta}>
                <button
                    type="button"
                    className={classes.Timecode}
                    onClick={() => onSeek(comment.frame)}
                    aria-label={`Перейти к кадру ${comment.frame}`}
                >
                    {formatTimecode(comment.frame, fps)}
                </button>
                <span className={classes.Author}>{comment.authorName}</span>
                <span className={classes.Date}>{formatDateTime(comment.createdAt)}</span>
            </div>

            {comment.thumbnail && (
                <img
                    src={comment.thumbnail}
                    alt={`Кадр ${comment.frame}`}
                    className={classes.Thumbnail}
                    onClick={() => onSeek(comment.frame)}
                />
            )}

            <p className={classes.Text}>{comment.text}</p>

            <div className={classes.Actions}>
                <button
                    type="button"
                    className={classes.Action}
                    onClick={() => onToggleResolved(comment.id, !comment.resolved)}
                >
                    {comment.resolved ? "Вернуть в работу" : "Исправлено"}
                </button>
                {canDelete && (
                    <button type="button" className={classes.Action} onClick={() => onDelete(comment.id)}>
                        Удалить
                    </button>
                )}
            </div>
        </li>
    );
}
