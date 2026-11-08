const THUMBNAIL_WIDTH = 240;

// Снимает кадр из <video>. Для кросс-доменных источников canvas "грязный" — тогда вернём undefined
export function captureFrame(video: HTMLVideoElement | null): string | undefined {
    if (!video || !video.videoWidth || !video.videoHeight){
        return undefined;
    }

    try{
        const canvas = document.createElement("canvas");
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = Math.round(THUMBNAIL_WIDTH * (video.videoHeight / video.videoWidth));

        const context = canvas.getContext("2d");

        if (!context){
            return undefined;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.7);
    }catch{
        return undefined;
    }
}
