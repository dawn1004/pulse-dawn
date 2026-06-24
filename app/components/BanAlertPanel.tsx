"use client";

import { useEffect, useState } from "react";
import { Ban, Clock, ShieldAlert } from "lucide-react";
import type { BanStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatCountdown(bannedUntil: string | null): string | null {
  if (!bannedUntil) return null;
  const remaining = new Date(bannedUntil).getTime() - Date.now();
  if (remaining <= 0) return null;

  const totalSeconds = Math.ceil(remaining / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

export default function BanAlertPanel({ ban }: { ban: BanStatus }) {
  const [countdown, setCountdown] = useState<string | null>(() =>
    ban.permanentBan ? null : formatCountdown(ban.bannedUntil),
  );

  useEffect(() => {
    if (ban.permanentBan) return;

    const tick = () => setCountdown(formatCountdown(ban.bannedUntil));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [ban.bannedUntil, ban.permanentBan]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-0 right-0 z-30 w-full max-w-md p-4",
        "animate-in fade-in-0 slide-in-from-right-4 duration-300",
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={cn(
          "pointer-events-auto overflow-hidden rounded-2xl border border-red-500/35",
          "bg-zinc-950/95 shadow-2xl shadow-red-950/40 backdrop-blur-xl",
          "ring-1 ring-red-500/15",
        )}
      >
        <div className="relative border-b border-red-500/20 bg-linear-to-br from-red-500/15 via-zinc-950 to-zinc-950 px-4 py-3.5">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-8 -right-6 size-24 rounded-full bg-red-500/20 blur-2xl"
          />
          <div className="relative flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
              <ShieldAlert className="size-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-medium tracking-wide text-red-400/90 uppercase">
                Access restricted
              </p>
              <h2 className="text-base font-semibold text-zinc-50">
                Unable to connect
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-3.5">
          <p className="text-sm leading-relaxed text-zinc-300">
            {ban.message}
          </p>

          {ban.permanentBan ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2.5 text-sm text-red-200/90">
              <Ban className="size-4 shrink-0 text-red-400" />
              <span>Permanent restriction</span>
            </div>
          ) : countdown ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="size-3.5 shrink-0" />
                <span>Time remaining</span>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-red-300">
                {countdown}
              </span>
            </div>
          ) : null}

          <p className="text-xs leading-relaxed text-zinc-500">
            You can browse the map, but new connections are disabled until the
            restriction lifts.
          </p>
        </div>
      </div>
    </div>
  );
}
