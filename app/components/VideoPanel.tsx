"use client";

import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatCallDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setTrackEnabled(
  stream: MediaStream | null,
  kind: "audio" | "video",
  enabled: boolean
) {
  for (const track of stream?.getTracks() ?? []) {
    if (track.kind === kind) {
      track.enabled = enabled;
    }
  }
}

function ControlButton({
  label,
  pressed,
  danger,
  compact,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  danger?: boolean;
  compact?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        "rounded-full text-white hover:text-white",
        compact ? "size-10" : "size-12",
        danger
          ? "bg-red-500 hover:bg-red-400"
          : pressed
            ? "bg-white text-zinc-900 hover:bg-zinc-200 hover:text-zinc-900"
            : "bg-zinc-800/90 hover:bg-zinc-700"
      )}
    >
      {children}
    </Button>
  );
}

export default function VideoPanel({
  localStream,
  remoteStream,
  remoteCameraOn,
  onCameraChange,
  onEnd,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteCameraOn: boolean;
  onCameraChange: (cameraOn: boolean) => void;
  onEnd: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [prevLocalStream, setPrevLocalStream] = useState(localStream);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  if (localStream !== prevLocalStream) {
    setPrevLocalStream(localStream);
    setMicOn(
      localStream?.getAudioTracks().every((track) => track.enabled) ?? true
    );
    setCameraOn(
      localStream?.getVideoTracks().every((track) => track.enabled) ?? true
    );
  }

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    // Client-only layout after mount — desktop starts docked; avoids hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect -- intentional post-mount bootstrap */
    if (window.matchMedia("(min-width: 768px)").matches) {
      setExpanded(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (localRef.current && localRef.current.srcObject !== localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteRef.current.srcObject !== remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteRef.current) {
      remoteRef.current.muted = speakerMuted;
    }
  }, [speakerMuted, remoteStream]);

  useEffect(() => {
    if (!localStream) return;
    const enabled =
      localStream.getVideoTracks().every((track) => track.enabled) ?? true;
    onCameraChange(enabled);
  }, [localStream, onCameraChange]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!expanded) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        window.matchMedia("(min-width: 768px)").matches
      ) {
        setExpanded(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded]);

  function toggleMic() {
    const next = !micOn;
    setTrackEnabled(localStream, "audio", next);
    setMicOn(next);
  }

  function toggleCamera() {
    const next = !cameraOn;
    setTrackEnabled(localStream, "video", next);
    setCameraOn(next);
    onCameraChange(next);
  }

  function toggleSpeaker() {
    setSpeakerMuted((value) => !value);
  }

  const isMobileMinimized = isMobile && !expanded;

  return (
    <div
      className={cn(
        "absolute flex flex-col overflow-hidden bg-black",
        expanded && "inset-0 z-40",
        !expanded &&
          "md:inset-y-0 md:left-0 md:z-10 md:right-[min(100%,28rem)] md:border-r md:border-zinc-800",
        isMobileMinimized &&
          "top-4 left-3 z-50 h-44 w-32 rounded-xl border border-zinc-700 shadow-2xl"
      )}
    >
      <div className="relative min-h-0 flex-1">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className={cn(
            "h-full w-full bg-zinc-900 object-cover",
            remoteStream && !remoteCameraOn && "opacity-0"
          )}
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-[10px] text-zinc-500 md:px-3 md:text-sm">
            Waiting for stranger&rsquo;s video…
          </div>
        )}
        {remoteStream && !remoteCameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 px-4 text-center text-zinc-400">
            <VideoOff className="size-8 md:size-12" aria-hidden />
            <p className="mt-2 text-xs md:text-sm">Stranger turned off camera</p>
          </div>
        )}

        {isMobileMinimized && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 bg-black/75 px-2 py-2 backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(true)}
              aria-label="Enter fullscreen"
              className="size-8 rounded-full bg-zinc-800/90 text-white hover:bg-zinc-700 hover:text-white"
            >
              <Maximize2 className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEnd}
              aria-label="End call"
              className="size-8 rounded-full bg-red-500 text-white hover:bg-red-400 hover:text-white"
            >
              <PhoneOff className="size-3.5" />
            </Button>
          </div>
        )}

        <div className="absolute top-3 left-3 z-10 hidden md:top-4 md:block">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? "Exit fullscreen" : "Enter fullscreen"}
            className="size-10 rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70 hover:text-white"
          >
            {expanded ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
        </div>

        <div
          className={cn(
            "absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-white tabular-nums backdrop-blur md:top-4 md:px-3 md:py-1 md:text-sm",
            !expanded && "max-md:hidden"
          )}
        >
          {formatCallDuration(elapsedSeconds)}
        </div>

        <div
          className={cn(
            "absolute top-3 right-3 md:top-4 md:right-4",
            !expanded && "max-md:hidden"
          )}
        >
          <div className="relative h-20 w-16 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 md:h-32 md:w-24 lg:h-40 lg:w-28">
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "h-full w-full object-cover",
                !cameraOn && "opacity-0"
              )}
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-500">
                <VideoOff className="size-4 md:size-6" aria-hidden />
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 bg-linear-to-t from-black via-black/90 to-transparent px-2 pt-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-4 md:pt-12 md:pb-[max(1rem,env(safe-area-inset-bottom))]",
          !expanded && "max-md:hidden"
        )}
      >
        <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-2 md:max-w-none md:flex-nowrap md:gap-3">
          <div className="md:hidden">
            <ControlButton
              compact
              label="Show chat"
              onClick={() => setExpanded(false)}
            >
              <MessageSquare className="size-4" />
            </ControlButton>
          </div>

          <ControlButton
            compact
            label={micOn ? "Mute microphone" : "Unmute microphone"}
            pressed={!micOn}
            onClick={toggleMic}
          >
            {micOn ? (
              <Mic className="size-4 md:size-5" />
            ) : (
              <MicOff className="size-4 md:size-5" />
            )}
          </ControlButton>

          <ControlButton
            compact
            label={cameraOn ? "Turn camera off" : "Turn camera on"}
            pressed={!cameraOn}
            onClick={toggleCamera}
          >
            {cameraOn ? (
              <Video className="size-4 md:size-5" />
            ) : (
              <VideoOff className="size-4 md:size-5" />
            )}
          </ControlButton>

          <ControlButton
            compact
            label={speakerMuted ? "Unmute audio" : "Mute audio"}
            pressed={speakerMuted}
            onClick={toggleSpeaker}
          >
            {speakerMuted ? (
              <VolumeX className="size-4 md:size-5" />
            ) : (
              <Volume2 className="size-4 md:size-5" />
            )}
          </ControlButton>

          <ControlButton compact label="End call" danger onClick={onEnd}>
            <PhoneOff className="size-4 md:size-5" />
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
