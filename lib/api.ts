// Client-side helpers for talking to the coordination API.
import type { SessionProfile } from "@/lib/profile";
import type { ReportReason } from "@/lib/moderation";
import {
  ReportError,
  type PollResponse,
  type SignalType,
} from "@/lib/types";

export { ReportError };

export async function join(
  id: string,
  lat: number,
  lng: number,
  profile: SessionProfile,
  fingerprint: string,
): Promise<void> {
  const res = await fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, lat, lng, fingerprint, ...profile }),
  });
  if (!res.ok) throw new Error(`join failed: ${res.status}`);
}

export async function poll(id: string): Promise<PollResponse> {
  const res = await fetch(`/api/poll?id=${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`poll failed: ${res.status}`);
  return res.json();
}

export async function sendSignal(
  fromId: string,
  toId: string,
  type: SignalType,
  payload?: string,
): Promise<void> {
  const res = await fetch("/api/signal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromId, toId, type, payload }),
  });
  if (res.status === 403) {
    throw new Error("banned");
  }
  if (!res.ok) throw new Error(`signal failed: ${res.status}`);
}

export async function reportUser(
  reporterSessionId: string,
  reportedSessionId: string,
  reason: ReportReason,
  details?: string,
): Promise<void> {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reporterSessionId,
      reportedSessionId,
      reason,
      details,
    }),
  });
  if (res.status === 409) {
    throw new ReportError(
      "You have already reported this user in this session.",
      "already_reported",
    );
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ReportError(
      data.error ?? "Could not submit report.",
      "unknown",
    );
  }
}

// Fire-and-forget leave that survives the tab closing.
// When peerId is set, the server notifies that partner before cleanup.
export function leave(id: string, peerId?: string): void {
  const body = JSON.stringify({ id, peerId });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/leave", body);
  } else {
    void fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  }
}
