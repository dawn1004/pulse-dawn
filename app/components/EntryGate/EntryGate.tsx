"use client";

import { Globe } from "lucide-react";
import { useRef, useState } from "react";
import type { SessionProfile } from "@/lib/profile";
import Form from "./Form";
import PulseMark from "./PulseMark";

export default function EntryGate({
  onReady,
}: {
  onReady: (
    lat: number,
    lng: number,
    profile: SessionProfile,
    turnstileToken: string,
  ) => void | Promise<void>;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [error, setError] = useState<string>("");
  const profileRef = useRef<SessionProfile | null>(null);
  const turnstileRef = useRef<string | null>(null);

  function enter(profile: SessionProfile, turnstileToken: string) {
    profileRef.current = profile;
    turnstileRef.current = turnstileToken;
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location access.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = profileRef.current;
        const token = turnstileRef.current;
        if (!p || !token) return;
        void Promise.resolve(
          onReady(pos.coords.latitude, pos.coords.longitude, p, token),
        ).catch(() => {
          setStatus("error");
          setError("Couldn't join. Please try again.");
        });
      },
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is required to place you on the map."
            : "Couldn't get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  }

  return (
    <div className="relative min-h-full flex-1 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 size-72 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="container relative mx-auto flex min-h-full flex-1 flex-col px-4 py-10 sm:px-6 lg:grid lg:min-h-full lg:max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16 xl:gap-24">
        <section className="flex flex-col justify-center lg:py-8">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Globe className="size-3.5 text-primary" />
            Live globe
          </div>

          <h1 className="flex items-center gap-3.5 text-5xl font-bold tracking-tight sm:text-6xl xl:text-7xl">
            <PulseMark />
            <span className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Pulse
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            A living globe of anonymous strangers. Drop onto the map and
            connect.
          </p>

          <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground/80 lg:mt-5">
            Quick setup (nickname, mood, interests). No accounts. Your session
            is temporary. Closing the tab ends everything. Your dot is placed
            1–3 km from your real location.
          </p>
        </section>

        <section className="mt-12 flex flex-col items-stretch lg:mt-0 lg:justify-center">
          <div className="rounded-2xl border border-border/60 bg-card/30 p-5 shadow-xl backdrop-blur sm:p-6">
            <Form onEnter={enter} locateStatus={status} locateError={error} />
          </div>
        </section>
      </div>
    </div>
  );
}
