import { PLAYBACK_RATES } from "../../constants/review";
import type { VideoPlayerApi } from "../../hooks/useVideoPlayer";
import type { FrameComment } from "../../types";
import { formatTimecode } from "../../utils/timecode";
import { Timeline } from "../Timeline/Timeline";
import classes from "./VideoPlayer.module.css";

interface VideoPlayerProps {
    src: string;
    fps: number;
    comments: FrameComment[];
    player: VideoPlayerApi;
}

export function VideoPlayer({ src, fps, comments, player }: VideoPlayerProps){

    const { videoRef, currentFrame, totalFrames, isPlaying, isReady, hasError, playbackRate } = player;
    const frameComments = comments.filter((comment) => comment.frame === currentFrame);

    return(
        <div className={classes.Player}>
            <div className={classes.Screen} onClick={player.togglePlay}>
                <video
                    ref={videoRef}
                    src={src}
                    className={classes.Video}
                    preload="auto"
                    playsInline
                />

                {frameComments.length > 0 && (
                    <div className={classes.FrameNote}>Замечаний на кадре: {frameComments.length}</div>
                )}

                {!isReady && (
                    <div className={classes.Loader}>
                        {hasError
                            ? "Не удалось воспроизвести видео. Проверьте формат файла (лучше всего MP4 H.264 или WebM)."
                            : "Загрузка видео…"}
                    </div>
                )}
            </div>

            <div className={classes.Controls}>
                <div className={classes.Row}>
                    <div className={classes.Transport}>
                        <button type="button" className={classes.Control} title="−1 секунда (Shift + ←)" onClick={() => player.stepFrames(-Math.round(fps))}>
                            −1 с
                        </button>
                        <button type="button" className={classes.Control} title="Предыдущий кадр (←)" onClick={() => player.stepFrames(-1)}>
                            ← кадр
                        </button>
                        <button type="button" className={classes.Play} title="Пробел" onClick={player.togglePlay}>
                            {isPlaying ? "Пауза" : "Пуск"}
                        </button>
                        <button type="button" className={classes.Control} title="Следующий кадр (→)" onClick={() => player.stepFrames(1)}>
                            кадр →
                        </button>
                        <button type="button" className={classes.Control} title="+1 секунда (Shift + →)" onClick={() => player.stepFrames(Math.round(fps))}>
                            +1 с
                        </button>
                    </div>

                    <div className={classes.Readout}>
                        <span className={classes.Timecode}>{formatTimecode(currentFrame, fps)}</span>
                        <span className={classes.FrameInfo}>
                            кадр {currentFrame} из {totalFrames} · {fps} fps
                        </span>
                    </div>

                    <div className={classes.Rates} role="group" aria-label="Скорость воспроизведения">
                        {PLAYBACK_RATES.map((rate) => (
                            <button
                                key={rate}
                                type="button"
                                aria-pressed={playbackRate === Number(rate)}
                                className={`${classes.Control} ${playbackRate === Number(rate) ? classes.ControlActive : ""}`}
                                onClick={() => player.setPlaybackRate(Number(rate))}
                            >
                                {rate}×
                            </button>
                        ))}
                    </div>
                </div>

                <Timeline
                    currentFrame={currentFrame}
                    totalFrames={totalFrames}
                    fps={fps}
                    comments={comments}
                    onSeek={player.seekToFrame}
                />
            </div>
        </div>
    );
}
