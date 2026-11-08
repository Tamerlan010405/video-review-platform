import { useMemo, useRef, useState, type PointerEvent } from "react";

import type { FrameComment } from "../../types";
import { formatDuration, formatTimecode } from "../../utils/timecode";
import classes from "./Timeline.module.css";

interface TimelineProps {
    currentFrame: number;
    totalFrames: number;
    fps: number;
    comments: FrameComment[];
    onSeek: (frame: number) => void;
}

const TICK_STEPS_SECONDS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
const MAX_TICKS = 12;

export function Timeline({ currentFrame, totalFrames, fps, comments, onSeek }: TimelineProps){

    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverFrame, setHoverFrame] = useState<number | null>(null);

    const maxFrame = Math.max(1, totalFrames - 1);
    const toPercent = (frame: number) => Math.min(100, Math.max(0, (frame / maxFrame) * 100));

    // Шаг линейки подбираем так, чтобы делений было не больше MAX_TICKS
    const ticks = useMemo(() => {
        const durationSeconds = totalFrames / fps;
        const step = TICK_STEPS_SECONDS.find((value) => durationSeconds / value <= MAX_TICKS) ?? 900;
        const result: number[] = [];

        for (let second = 0; second <= durationSeconds; second += step){
            result.push(second);
        }
        return result;
    }, [totalFrames, fps]);

    function getFrameFromPointer(event: PointerEvent<HTMLDivElement>): number {
        const rect = trackRef.current?.getBoundingClientRect();

        if (!rect || rect.width === 0){
            return 0;
        }

        const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        return Math.round(ratio * maxFrame);
    }

    function handlePointerDown(event: PointerEvent<HTMLDivElement>){
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDragging(true);
        onSeek(getFrameFromPointer(event));
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>){
        const frame = getFrameFromPointer(event);

        setHoverFrame(frame);
        if (isDragging){
            onSeek(frame);
        }
    }

    function handlePointerUp(event: PointerEvent<HTMLDivElement>){
        event.currentTarget.releasePointerCapture(event.pointerId);
        setIsDragging(false);
    }

    return(
        <div
            ref={trackRef}
            className={classes.Timeline}
            role="slider"
            aria-label="Таймлайн"
            aria-valuemin={0}
            aria-valuemax={maxFrame}
            aria-valuenow={currentFrame}
            aria-valuetext={formatTimecode(currentFrame, fps)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => setHoverFrame(null)}
        >
            <div className={classes.Ruler}>
                {ticks.map((second) => (
                    <span key={second} className={classes.Tick} style={{ left: `${toPercent(second * fps)}%` }}>
                        {formatDuration(second)}
                    </span>
                ))}
            </div>

            <div className={classes.Lane}>
                {comments.map((comment) => (
                    <button
                        key={comment.id}
                        type="button"
                        className={`${classes.Pin} ${comment.resolved ? classes.PinResolved : ""}`}
                        style={{ left: `${toPercent(comment.frame)}%` }}
                        title={`${formatTimecode(comment.frame, fps)} — ${comment.text}`}
                        aria-label={`Комментарий на ${formatTimecode(comment.frame, fps)}`}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => onSeek(comment.frame)}
                    />
                ))}
            </div>

            <div className={classes.Track}>
                <div className={classes.Progress} style={{ width: `${toPercent(currentFrame)}%` }} />
            </div>

            {hoverFrame !== null && (
                <div className={classes.HoverLine} style={{ left: `${toPercent(hoverFrame)}%` }}>
                    <span className={classes.HoverLabel}>{formatTimecode(hoverFrame, fps)}</span>
                </div>
            )}

            <div className={classes.Playhead} style={{ left: `${toPercent(currentFrame)}%` }} />
        </div>
    );
}
