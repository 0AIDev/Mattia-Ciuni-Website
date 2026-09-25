"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

type MediaElement = HTMLAudioElement | HTMLVideoElement;

type PlayerProps = {
  src: string;
  title: string;
  poster?: string;
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const seconds = Math.floor(value);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="m5 2.5 7 5.5-7 5.5z" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M2 6.2v3.6h2.5L8 12.5v-9L4.5 6.2H2ZM10.5 6l3 4M13.5 6l-3 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M2 6.2v3.6h2.5L8 12.5v-9L4.5 6.2H2ZM10.5 6a3 3 0 0 1 0 4M12.5 4.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Progress({
  current,
  duration,
  onChange,
  dark = false,
}: {
  current: number;
  duration: number;
  onChange: (value: number) => void;
  dark?: boolean;
}) {
  return (
    <input
      aria-label="Seek"
      type="range"
      min="0"
      max={duration || 0}
      step="0.1"
      value={Math.min(current, duration || 0)}
      onChange={(event) => onChange(Number(event.target.value))}
      className={`h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-current ${dark ? "text-gray-background" : "text-gray-1200"}`}
    />
  );
}

/**
 * Lo stato di un player, con il tracciamento di due soli momenti che contano:
 * quando parte e quando finisce. Il resto (ricerca, mute, pausa) è rumore: la
 * domanda utile è "quanti ascoltano davvero una voice note", non quante volte
 * viene toccata la barra di avanzamento.
 */
function useMediaState<T extends MediaElement>(media: React.RefObject<T | null>, mediaKind: "audio" | "video", title: string) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const progressMarks = useRef(new Set<number>());

  useEffect(() => {
    const element = media.current;
    if (!element) return;
    const onLoaded = () => setDuration(element.duration || 0);
    const onTime = () => {
      setCurrent(element.currentTime);
      if (!element.duration || !Number.isFinite(element.duration)) return;
      const percent = Math.floor((element.currentTime / element.duration) * 100);
      for (const mark of [25, 50, 75]) {
        if (percent >= mark && !progressMarks.current.has(mark)) {
          progressMarks.current.add(mark);
          track("media_progress", { media_kind: mediaKind, media_title: title, percent });
        }
      }
    };
    const onPlay = () => {
      setPlaying(true);
      track("media_play", { media_kind: mediaKind, media_title: title });
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      progressMarks.current.clear();
      setPlaying(false);
      setCurrent(0);
      track("media_complete", { media_kind: mediaKind, media_title: title });
    };
    element.addEventListener("loadedmetadata", onLoaded);
    element.addEventListener("durationchange", onLoaded);
    element.addEventListener("timeupdate", onTime);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("ended", onEnded);
    onLoaded();
    onTime();
    return () => {
      element.removeEventListener("loadedmetadata", onLoaded);
      element.removeEventListener("durationchange", onLoaded);
      element.removeEventListener("timeupdate", onTime);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("ended", onEnded);
    };
  }, [media, mediaKind, title]);

  function togglePlay() {
    const element = media.current;
    if (!element) return;
    if (element.paused) void element.play().catch(() => setPlaying(false));
    else element.pause();
  }

  function seek(value: number) {
    const element = media.current;
    if (!element) return;
    // The media element is intentionally controlled imperatively by the custom seek bar.
    // eslint-disable-next-line react-hooks/immutability
    element.currentTime = value;
    setCurrent(value);
  }

  function toggleMute() {
    const element = media.current;
    if (!element) return;
    // The media element is intentionally controlled imperatively by the custom volume button.
    // eslint-disable-next-line react-hooks/immutability
    element.muted = !element.muted;
    setMuted(element.muted);
  }

  return { playing, current, duration, muted, togglePlay, seek, toggleMute };
}

export function AudioPlayer({ src, title }: PlayerProps) {
  const media = useRef<HTMLAudioElement>(null);
  const state = useMediaState(media, "audio", title);

  return (
    <div className="rounded-xl border border-gray-300 px-3 py-2.5" aria-label={`Audio player: ${title}`}>
      <audio ref={media} src={src} preload="metadata" aria-label={`Audio: ${title}`} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={state.togglePlay}
          aria-label={state.playing ? `Pause ${title}` : `Play ${title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-1200 text-gray-background transition-opacity hover:opacity-80 focus-visible:outline"
        >
          <PlayIcon playing={state.playing} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3 text-xs text-gray-1000">
            <span className="truncate">{title}</span>
            <span className="shrink-0 tabular-nums">{formatTime(state.current)} / {formatTime(state.duration)}</span>
          </div>
          <Progress current={state.current} duration={state.duration} onChange={state.seek} />
        </div>
        <button
          type="button"
          onClick={state.toggleMute}
          aria-label={state.muted ? `Unmute ${title}` : `Mute ${title}`}
          className="shrink-0 text-gray-1000 transition-colors hover:text-gray-1200 focus-visible:outline"
        >
          <VolumeIcon muted={state.muted} />
        </button>
      </div>
    </div>
  );
}

export function VideoPlayer({ src, title, poster }: PlayerProps) {
  const media = useRef<HTMLVideoElement>(null);
  const state = useMediaState(media, "video", title);

  function fullscreen() {
    const element = media.current;
    if (!element) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void element.requestFullscreen?.();
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-300 bg-gray-1200" aria-label={`Video player: ${title}`}>
      <video
        ref={media}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        tabIndex={0}
        role="button"
        aria-label={state.playing ? `Pause ${title}` : `Play ${title}`}
        className="aspect-video w-full object-contain"
        onClick={state.togglePlay}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            state.togglePlay();
          }
        }}
      />
      {!state.playing ? (
        <button
          type="button"
          onClick={state.togglePlay}
          aria-label={`Play ${title}`}
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-preview-bg/95 text-gray-1200 shadow-sm transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-white"
        >
          <PlayIcon playing={false} />
        </button>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gray-1200/90 px-3 py-2 text-gray-background opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <button
          type="button"
          onClick={state.togglePlay}
          aria-label={state.playing ? `Pause ${title}` : `Play ${title}`}
          className="shrink-0 focus-visible:outline focus-visible:outline-white"
        >
          <PlayIcon playing={state.playing} />
        </button>
        <span className="shrink-0 text-xs tabular-nums">{formatTime(state.current)}</span>
        <Progress current={state.current} duration={state.duration} onChange={state.seek} dark />
        <span className="shrink-0 text-xs tabular-nums">{formatTime(state.duration)}</span>
        <button
          type="button"
          onClick={state.toggleMute}
          aria-label={state.muted ? `Unmute ${title}` : `Mute ${title}`}
          className="shrink-0 focus-visible:outline focus-visible:outline-white"
        >
          <VolumeIcon muted={state.muted} />
        </button>
        <button
          type="button"
          onClick={fullscreen}
          aria-label={`Fullscreen ${title}`}
          className="shrink-0 focus-visible:outline focus-visible:outline-white"
        >
          <FullscreenIcon />
        </button>
      </div>
    </div>
  );
}
