const POSTER_WIDTH = 320;
const POSTER_TIMEOUT_MS = 5000;

// Берёт кадр из начала загруженного файла для превью в списке. Не получилось — вернём undefined
export function capturePoster(file: File): Promise<string | undefined> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        let isDone = false;

        function finish(result: string | undefined){
            if (isDone){
                return;
            }
            isDone = true;
            clearTimeout(timer);
            URL.revokeObjectURL(url);
            resolve(result);
        }

        const timer = setTimeout(() => finish(undefined), POSTER_TIMEOUT_MS);

        video.muted = true;
        video.preload = "metadata";
        video.onerror = () => finish(undefined);
        video.onloadedmetadata = () => {
            video.currentTime = Math.min(1, video.duration / 10);
        };
        video.onseeked = () => {
            try{
                const canvas = document.createElement("canvas");
                canvas.width = POSTER_WIDTH;
                canvas.height = Math.round(POSTER_WIDTH * (video.videoHeight / video.videoWidth));
                canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
                finish(canvas.toDataURL("image/jpeg", 0.7));
            }catch{
                finish(undefined);
            }
        };
        video.src = url;
    });
}
