"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PhoneOff, Video } from "lucide-react";
import { AVATARS } from "@/app/constants";
import { Button } from "@/components/ui/button";

function useOutgoingCallTone(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const ctx = new AudioContext();
    let cancelled = false;
    let toneTimeout: ReturnType<typeof setTimeout> | null = null;

    function playTone() {
      if (cancelled) return;

      const start = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 425;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.1);

      toneTimeout = setTimeout(playTone, 3200);
    }

    void ctx.resume().then(() => {
      if (!cancelled) playTone();
    });

    return () => {
      cancelled = true;
      if (toneTimeout) clearTimeout(toneTimeout);
      void ctx.close();
    };
  }, [active]);
}

export default function OutgoingVideoCall({
  nickname,
  avatar,
  onCancel,
}: {
  nickname?: string;
  avatar?: string;
  onCancel: () => void;
}) {
  useOutgoingCallTone(true);

  const [dots, setDots] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDots((value) => (value.length >= 3 ? "" : `${value}.`));
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  const mood = avatar ? AVATARS.find((item) => item.id === avatar) : undefined;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-between bg-zinc-950/95 px-6 py-10 backdrop-blur-sm">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-8 flex size-36 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full border-2 border-sky-400/35 animate-[incoming-call-pulse_2.8s_ease-out_infinite]"
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full border-2 border-sky-400/25 animate-[incoming-call-pulse_2.8s_ease-out_infinite_0.9s]"
            aria-hidden
          />
          <span
            className="absolute inset-0 rounded-full border-2 border-sky-400/15 animate-[incoming-call-pulse_2.8s_ease-out_infinite_1.8s]"
            aria-hidden
          />

          <div className="relative z-10 flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-sky-400/45 bg-zinc-900 shadow-[0_0_32px_rgba(56,189,248,0.28)]">
            {mood ? (
              <Image
                src={mood.src}
                alt={mood.label}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <Video className="size-12 text-sky-400" aria-hidden />
            )}
          </div>
        </div>

        <p className="text-sm font-medium tracking-wide text-sky-400 uppercase">
          Calling
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-50">
          {nickname ?? "Stranger"}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Waiting for them to join
          <span className="inline-block w-4 text-left">{dots}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 pb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={onCancel}
          aria-label="Cancel video call"
          className="size-16 rounded-full bg-red-500 text-white hover:bg-red-400 hover:text-white"
        >
          <PhoneOff className="size-7" />
        </Button>
        <span className="text-xs text-zinc-500">Cancel</span>
      </div>
    </div>
  );
}
