const FRAME_EPSILON = 0.01;

function pad(value: number, length = 2): string {
    return String(value).padStart(length, "0");
}

export function timeToFrame(time: number, fps: number): number {
    if (!Number.isFinite(time) || time < 0){
        return 0;
    }
    return Math.floor(time * fps + 1e-6);
}

// Смещение на долю кадра, чтобы браузер не округлил время к предыдущему кадру
export function frameToTime(frame: number, fps: number): number {
    return (Math.max(0, frame) + FRAME_EPSILON) / fps;
}

export function formatTimecode(frame: number, fps: number): string {
    const nominalFps = Math.round(fps);
    const safeFrame = Math.max(0, frame);
    const frames = safeFrame % nominalFps;
    const totalSeconds = Math.floor(safeFrame / nominalFps);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

export function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds)){
        return "–";
    }
    const total = Math.floor(seconds);
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
