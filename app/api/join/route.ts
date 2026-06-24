import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyPrivacyOffset, isValidLatLng } from "@/lib/geo";
import { isValidFingerprint } from "@/lib/moderation";
import { parseSessionProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/join — body { id, lat, lng, fingerprint, nickname, aboutMe, avatar, tags }.
// Applies a 1–3 km privacy offset and upserts the ephemeral presence row.
// Raw coordinates are never stored.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { id, lat, lng, fingerprint, nickname, aboutMe, avatar, tags } =
    (body ?? {}) as Record<string, unknown>;

  if (typeof id !== "string" || id.length < 8 || id.length > 64) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  if (!isValidLatLng(lat, lng)) {
    return Response.json({ error: "invalid coordinates" }, { status: 400 });
  }
  if (!isValidFingerprint(fingerprint)) {
    return Response.json({ error: "invalid fingerprint" }, { status: 400 });
  }

  const profileResult = parseSessionProfile({
    nickname,
    aboutMe,
    avatar,
    tags,
  });
  if (!profileResult.ok) {
    return Response.json({ error: profileResult.error }, { status: 400 });
  }

  const offset = applyPrivacyOffset(lat as number, lng as number);
  const { profile } = profileResult;

  await prisma.presence.upsert({
    where: { id },
    create: {
      id,
      lat: offset.lat,
      lng: offset.lng,
      busy: false,
      lastSeen: new Date(),
      nickname: profile.nickname,
      aboutMe: profile.aboutMe,
      avatar: profile.avatar,
      tags: profile.tags,
      fingerprint,
    },
    update: {
      lat: offset.lat,
      lng: offset.lng,
      lastSeen: new Date(),
      nickname: profile.nickname,
      aboutMe: profile.aboutMe,
      avatar: profile.avatar,
      tags: profile.tags,
      fingerprint,
    },
  });

  return Response.json({ ok: true });
}
