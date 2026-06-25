import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { STALE_MS, SIGNAL_TTL_MS } from "@/lib/presence";
import {
  bannedFingerprintSet,
  formatReportedBanMessage,
  isBanned,
} from "@/lib/moderation";
import type { PollResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/poll?id= — the single endpoint that drives the live map.
// It (1) heartbeats the caller, (2) reaps stale presence + orphan signals,
// (3) returns the filtered online peers, and (4) drains this user's mailbox.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id");

  if (!id) {
    return Response.json({ error: "missing id" }, { status: 400 });
  }

  const now = Date.now();
  const staleCutoff = new Date(now - STALE_MS);
  const signalCutoff = new Date(now - SIGNAL_TTL_MS);

  // 1) Heartbeat — refresh lastSeen for the caller only.
  let caller: { fingerprint: string | null } | null = null;
  try {
    caller = await prisma.presence.update({
      where: { id },
      data: { lastSeen: new Date(now) },
      select: { fingerprint: true },
    });
  } catch {
    return Response.json({ error: "unknown session" }, { status: 404 });
  }

  let ban: PollResponse["ban"] = null;
  const banPromise = caller?.fingerprint
    ? prisma.deviceModeration.findUnique({
        where: { fingerprint: caller.fingerprint },
      })
    : Promise.resolve(null);

  // 2) Reap stale presence rows and orphaned signals (independent deletes —
  // no atomicity needed, and avoids transactions over a PgBouncer pooler).
  const reapPresencePromise = prisma.presence.deleteMany({
    where: { lastSeen: { lt: staleCutoff } },
  });
  const reapSignalsPromise = prisma.signal.deleteMany({
    where: { createdAt: { lt: signalCutoff } },
  });

  // 3) Online peers, excluding self.
  const peersPromise = prisma.presence.findMany({
    where: {
      id: { not: id },
      lastSeen: { gte: staleCutoff },
    },
    select: {
      id: true,
      lat: true,
      lng: true,
      busy: true,
      nickname: true,
      aboutMe: true,
      avatar: true,
      tags: true,
      fingerprint: true,
    },
  });

  // 4) Drain this user's mailbox: read, then delete exactly what we read so a
  // concurrently-inserted signal is never lost.
  const inboxPromise = prisma.signal.findMany({
    where: { toId: id },
    orderBy: { createdAt: "asc" },
  });
  const [moderation, peersRaw, inbox] = await Promise.all([
    banPromise,
    peersPromise,
    inboxPromise,
  ]);

  // Await reaping after the reads are underway (keeps latency down).
  await Promise.all([reapPresencePromise, reapSignalsPromise]);

  if (moderation && isBanned(moderation)) {
    ban = {
      message: formatReportedBanMessage(
        moderation.bannedUntil,
        moderation.permanentBan
      ),
      bannedUntil: moderation.bannedUntil?.toISOString() ?? null,
      permanentBan: moderation.permanentBan,
    };
  }

  const fingerprints = [
    ...new Set(
      peersRaw
        .map((p) => p.fingerprint)
        .filter((f): f is string => typeof f === "string" && f.length > 0)
    ),
  ];
  const moderations =
    fingerprints.length > 0
      ? await prisma.deviceModeration.findMany({
          where: { fingerprint: { in: fingerprints } },
        })
      : [];
  const bannedFingerprints = bannedFingerprintSet(moderations);

  if (inbox.length > 0) {
    await prisma.signal.deleteMany({
      where: { id: { in: inbox.map((s) => s.id) } },
    });
  }

  const response: PollResponse = {
    peers: peersRaw.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      busy: p.busy,
      banned: !!p.fingerprint && bannedFingerprints.has(p.fingerprint),
      nickname: p.nickname,
      aboutMe: p.aboutMe,
      avatar: p.avatar,
      tags: p.tags,
    })),
    signals: inbox.map((s) => ({
      id: s.id,
      fromId: s.fromId,
      toId: s.toId,
      type: s.type as PollResponse["signals"][number]["type"],
      payload: s.payload,
      createdAt: s.createdAt.toISOString(),
    })),
    ban,
  };

  return Response.json(response);
}
