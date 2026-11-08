import { useCallback, useEffect, useRef, useState } from "react";

import { frameToTime, timeToFrame } from "../utils/timecode";

export interface VideoPlayerApi {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    currentFrame: number;
    totalFrames: number;
    duration: number;
    isPlaying: boolean;
    isReady: boolean;
    hasError: boolean;
    playbackRate: number;
    togglePlay: () => void;
    pause: () => void;
    seekToFrame: (frame: number) => void;
    stepFrames: (delta: number) => void;
    setPlaybackRate: (rate: number) => void;
}

export function useVideoPlayer(fps: number): VideoPlayerApi {

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [playbackRate, setPlaybackRateState] = useState(1);

    const totalFrames = Math.max(0, Math.floor(duration * fps));

    useEffect(() => {
        const video = videoRef.current;

        if (!video){
            return;
        }

        const syncFrame = () => setCurrentFrame(timeToFrame(video.currentTime, fps));
        const handleMetadata = () => {
            setDuration(video.duration);
            setIsReady(true);
            syncFrame();
        };
        const handleError = () => setHasError(true);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => {
            setIsPlaying(false);
            syncFrame();
        };

        video.addEventListener("loadedmetadata", handleMetadata);
        video.addEventListener("seeked", syncFrame);
        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("ended", handlePause);
        video.addEventListener("error", handleError);

        if (video.readyState >= 1){
            handleMetadata();
        }
        if (video.error){
            handleError();
        }

        return () => {
            video.removeEventListener("loadedmetadata", handleMetadata);
            video.removeEventListener("seeked", syncFrame);
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("ended", handlePause);
            video.removeEventListener("error", handleError);
        };
    }, [fps]);

    // Пока видео играет, обновляем номер кадра на каждый animation frame
    useEffect(() => {
        const video = videoRef.current;

        if (!isPlaying || !video){
            return;
        }

        let rafId = 0;
        const tick = () => {
            setCurrentFrame(timeToFrame(video.currentTime, fps));
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafId);
    }, [isPlaying, fps]);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;

        if (!video){
            return;
        }

        if (video.paused){
            void video.play().catch(() => undefined);
        }else{
            video.pause();
        }
    }, []);

    const pause = useCallback(() => {
        videoRef.current?.pause();
    }, []);

    const seekToFrame = useCallback((frame: number) => {
        const video = videoRef.current;

        if (!video || !Number.isFinite(video.duration)){
            return;
        }

        const maxFrame = Math.max(0, Math.floor(video.duration * fps) - 1);
        const safeFrame = Math.min(Math.max(0, frame), maxFrame);

        video.currentTime = frameToTime(safeFrame, fps);
        setCurrentFrame(safeFrame);
    }, [fps]);

    const stepFrames = useCallback((delta: number) => {
        const video = videoRef.current;

        if (!video){
            return;
        }

        video.pause();
        seekToFrame(timeToFrame(video.currentTime, fps) + delta);
    }, [fps, seekToFrame]);

    const setPlaybackRate = useCallback((rate: number) => {
        if (videoRef.current){
            videoRef.current.playbackRate = rate;
        }
        setPlaybackRateState(rate);
    }, []);

    return {
        videoRef,
        currentFrame,
        totalFrames,
        duration,
        isPlaying,
        isReady,
        hasError,
        playbackRate,
        togglePlay,
        pause,
        seekToFrame,
        stepFrames,
        setPlaybackRate,
    };
}
