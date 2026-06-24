"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AVATARS } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import type { PeerDot } from "@/lib/types";

export default function PeerProfileModal({
  peer,
  onConnect,
  onCancel,
  primaryLabel = "Connect",
  secondaryLabel = "Cancel",
  header,
  showBusyNote = true,
}: {
  peer: PeerDot;
  onConnect: () => void;
  onCancel: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  header?: string;
  showBusyNote?: boolean;
}) {
  const mood = AVATARS.find((a) => a.id === peer.avatar);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-3xl bg-emerald-500/12 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl animate-modal-glow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl animate-modal-glow animation-delay-[1.4s]"
        />
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/70 bg-zinc-900 p-6 text-zinc-100 shadow-[0_0_20px_rgba(52,211,153,0.3),inset_0_1px_0_rgba(52,211,153,0.2)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-emerald-400/70 to-transparent"
          />
          {header && (
            <p className="mb-4 text-center text-sm font-medium text-emerald-300">
              {header}
            </p>
          )}
          <div className="flex items-start gap-3">
            {mood && (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 ring-2 ring-emerald-400/20">
                <Image
                  src={mood.src}
                  alt={mood.label}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="truncate text-lg font-semibold">{peer.nickname}</h2>
              {mood && (
                <p className="text-xs text-zinc-400">{mood.label} mood</p>
              )}
            </div>
          </div>

          {peer.aboutMe.trim() && (
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              {peer.aboutMe.trim()}
            </p>
          )}

          {peer.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {peer.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-2 py-0 text-[10px] capitalize"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {showBusyNote && peer.busy && !peer.banned && (
            <p className="mt-4 text-sm text-zinc-400">
              Currently in a conversation.
            </p>
          )}

          {peer.banned && (
            <p className="mt-4 text-sm text-red-300">
              This user is restricted and cannot receive new connections.
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500"
            >
              {secondaryLabel}
            </button>
            <button
              type="button"
              onClick={onConnect}
              disabled={peer.busy || peer.banned}
              className="flex-1 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-[0_0_16px_rgba(52,211,153,0.35)] hover:bg-emerald-300 hover:shadow-[0_0_20px_rgba(52,211,153,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
