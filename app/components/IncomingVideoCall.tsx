"use client";

import { useEffect } from "react";
import Image from "next/image";
import { PhoneOff, Video } from "lucide-react";
import { AVATARS } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useIncomingCallRing(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const ctx = new AudioContext();
    let cancelled = false;
    let ringTimeout: ReturnType<typeof setTimeout> | null = null;
    let vibrateInterval: ReturnType<typeof setInterval> | null = null;

    function playBurst() {
      if (cancelled) return;

      const start = ctx.currentTime;
      const tones = [
        { freq: 440, at: 0, duration: 0.35 },
        { freq: 554, at: 0.45, duration: 0.35 },
        { freq: 440, at: 0.95, duration: 0.35 },
        { freq: 554, at: 1.4, duration: 0.35 },
      ];

      for (const { freq, at, duration } of tones) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start + at);
        gain.gain.exponentialRampToValueAtTime(0.14, start + at + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + at + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start + at);
        osc.stop(start + at + duration);
      }

      ringTimeout = setTimeout(playBurst, 2800);
    }

    void ctx.resume().then(() => {
      if (!cancelled) playBurst();
    });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      const pulse = () => navigator.vibrate([280, 120, 280]);
      pulse();
      vibrateInterval = setInterval(pulse, 2800);
    }

    return () => {
      cancelled = true;
      if (ringTimeout) clearTimeout(ringTimeout);
      if (vibrateInterval) clearInterval(vibrateInterval);
      void ctx.close();
    };
  }, [active]);
}

export default function IncomingVideoCall({
  nickname,
  avatar,
  onAccept,
  onDecline,
}: {
  nickname?: string;
  avatar?: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  useIncomingCallRing(true);

  const mood = avatar ? AVATARS.find((item) => item.id === avatar) : undefined;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-between bg-zinc-950/95 px-6 py-10 backdrop-blur-sm">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-8 flex size-36 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-[incoming-call-pulse_2.4s_ease-out_infinite]"
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-[incoming-call-pulse_2.4s_ease-out_infinite_0.8s]"
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-[incoming-call-pulse_2.4s_ease-out_infinite_1.6s]"
            aria-hidden
          />

          <div className="relative z-10 flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-400/50 bg-zinc-900 shadow-[0_0_32px_rgba(52,211,153,0.35)]">
            {mood ? (
              <Image
                src={mood.src}
                alt={mood.label}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <Video className="size-12 text-emerald-400" aria-hidden />
            )}
          </div>
        </div>

        <p className="text-sm font-medium tracking-wide text-emerald-400 uppercase">
          Incoming video call
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
          {nickname ?? "Stranger"}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">wants to start a video call…</p>
      </div>

      <div className="flex w-full max-w-xs items-center justify-center gap-14 pb-4">
        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={onDecline}
            aria-label="Decline video call"
            className="size-16 rounded-full bg-red-500 text-white hover:bg-red-400 hover:text-white"
          >
            <PhoneOff className="size-7" />
          </Button>
          <span className="text-xs text-zinc-500">Decline</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={onAccept}
            aria-label="Accept video call"
            className={cn(
              "size-16 rounded-full bg-emerald-400 text-zinc-950 hover:bg-emerald-300 hover:text-zinc-950",
              "animate-[incoming-call-accept_1.2s_ease-in-out_infinite]"
            )}
          >
            <Video className="size-7" />
          </Button>
          <span className="text-xs text-zinc-500">Accept</span>
        </div>
      </div>
    </div>
  );
}
