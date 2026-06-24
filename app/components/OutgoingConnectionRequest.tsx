"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Radio, X } from "lucide-react";
import { AVATARS } from "@/app/constants";
import { Button } from "@/components/ui/button";
import type { PeerDot } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function OutgoingConnectionRequest({
  peer,
  onCancel,
}: {
  peer: PeerDot | null;
  onCancel: () => void;
}) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDots((value) => (value.length >= 3 ? "" : `${value}.`));
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const mood = peer?.avatar
    ? AVATARS.find((item) => item.id === peer.avatar)
    : undefined;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        role="status"
        aria-live="polite"
        aria-label={
          peer
            ? `Requesting connection with ${peer.nickname}`
            : "Requesting connection"
        }
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-3xl bg-emerald-500/12 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl animate-modal-glow"
        />

        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/50 bg-zinc-900/95 p-6 text-zinc-100 shadow-[0_0_28px_rgba(52,211,153,0.22)] backdrop-blur-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-emerald-400/60 to-transparent"
          />

          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex size-28 items-center justify-center">
              <span
                className="absolute inset-0 rounded-full border-2 border-emerald-400/35 animate-[incoming-call-pulse_2.8s_ease-out_infinite]"
                aria-hidden
              />
              <span
                className="absolute inset-0 rounded-full border-2 border-emerald-400/25 animate-[incoming-call-pulse_2.8s_ease-out_infinite_0.9s]"
                aria-hidden
              />
              <span
                className="absolute inset-0 rounded-full border-2 border-emerald-400/15 animate-[incoming-call-pulse_2.8s_ease-out_infinite_1.8s]"
                aria-hidden
              />

              <div className="relative z-10 flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-400/40 bg-zinc-800 shadow-[0_0_24px_rgba(52,211,153,0.2)]">
                {mood ? (
                  <Image
                    src={mood.src}
                    alt={mood.label}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <Radio className="size-9 text-emerald-400" aria-hidden />
                )}
              </div>
            </div>

            <p className="text-xs font-medium tracking-wider text-emerald-400 uppercase">
              Requesting connection
            </p>
            <h2 className="mt-1.5 text-xl font-semibold text-zinc-50">
              {peer?.nickname ?? "Stranger"}
            </h2>
            {mood && (
              <p className="mt-0.5 text-xs text-zinc-500">{mood.label} mood</p>
            )}
            <p className="mt-3 text-sm text-zinc-400">
              Waiting for them to accept
              <span className="inline-block w-4 text-left">{dots}</span>
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className={cn(
                "h-11 flex-1 rounded-full border-zinc-700 bg-transparent",
                "text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100",
              )}
            >
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
