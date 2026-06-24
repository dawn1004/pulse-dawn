import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyReportBan, isValidReportReason } from "@/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DETAILS = 500;

// POST /api/report  body { reporterSessionId, reportedSessionId, reason, details? }
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { reporterSessionId, reportedSessionId, reason, details } = (body ??
    {}) as Record<string, unknown>;

  if (
    typeof reporterSessionId !== "string" ||
    reporterSessionId.length < 8 ||
    reporterSessionId.length > 64
  ) {
    return Response.json(
      { error: "invalid reporter session" },
      { status: 400 }
    );
  }
  if (
    typeof reportedSessionId !== "string" ||
    reportedSessionId.length < 8 ||
    reportedSessionId.length > 64
  ) {
    return Response.json(
      { error: "invalid reported session" },
      { status: 400 }
    );
  }
  if (reporterSessionId === reportedSessionId) {
    return Response.json({ error: "cannot report yourself" }, { status: 400 });
  }
  if (typeof reason !== "string" || !isValidReportReason(reason)) {
    return Response.json({ error: "invalid reason" }, { status: 400 });
  }

  const detailsStr =
    details === undefined || details === null
      ? null
      : typeof details === "string"
      ? details.trim()
      : null;

  if (reason === "other") {
    if (!detailsStr) {
      return Response.json(
        { error: "details required for other" },
        { status: 400 }
      );
    }
    if (detailsStr.length > MAX_DETAILS) {
      return Response.json({ error: "details too long" }, { status: 400 });
    }
  } else if (detailsStr && detailsStr.length > MAX_DETAILS) {
    return Response.json({ error: "details too long" }, { status: 400 });
  }

  const reporter = await prisma.presence.findUnique({
    where: { id: reporterSessionId },
    select: { id: true },
  });
  if (!reporter) {
    return Response.json({ error: "reporter offline" }, { status: 400 });
  }

  const reported = await prisma.presence.findUnique({
    where: { id: reportedSessionId },
    select: { fingerprint: true },
  });
  if (!reported?.fingerprint) {
    return Response.json(
      { error: "reported user unavailable" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userReport.create({
        data: {
          reporterSessionId,
          reportedSessionId,
          reportedFingerprint: reported.fingerprint!,
          reason,
          details: detailsStr,
        },
      });

      const existing = await tx.deviceModeration.findUnique({
        where: { fingerprint: reported.fingerprint! },
      });

      const nextCount = (existing?.reportCount ?? 0) + 1;
      const ban = applyReportBan(nextCount);

      await tx.deviceModeration.upsert({
        where: { fingerprint: reported.fingerprint! },
        create: {
          fingerprint: reported.fingerprint!,
          reportCount: nextCount,
          bannedUntil: ban.bannedUntil,
          permanentBan: ban.permanentBan,
        },
        update: {
          reportCount: nextCount,
          bannedUntil: ban.bannedUntil,
          permanentBan: ban.permanentBan,
        },
      });
    });
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err && err.code === "P2002"
        ? "duplicate"
        : null;
    if (code === "duplicate") {
      return Response.json({ error: "already_reported" }, { status: 409 });
    }
    throw err;
  }

  await prisma.signal.create({
    data: {
      fromId: reporterSessionId,
      toId: reportedSessionId,
      type: "end",
      payload: null,
    },
  });
  await prisma.presence.updateMany({
    where: { id: { in: [reporterSessionId, reportedSessionId] } },
    data: { busy: false },
  });

  return Response.json({ ok: true });
}
