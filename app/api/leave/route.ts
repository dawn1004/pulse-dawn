import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/leave — body { id, peerId? }. Removes the presence row and any pending
// signals to/from this user. If peerId is provided (active connection), delivers
// an "end" signal to the partner first. Called via navigator.sendBeacon on tab
// close, so the body may arrive as text — parse defensively.
export async function POST(request: NextRequest) {
  let id: string | undefined;
  let peerId: string | undefined;
  try {
    const text = await request.text();
    if (text) {
      const parsed = JSON.parse(text) as { id?: unknown; peerId?: unknown };
      id = typeof parsed.id === "string" ? parsed.id : undefined;
      peerId = typeof parsed.peerId === "string" ? parsed.peerId : undefined;
    }
  } catch {
    id = undefined;
    peerId = undefined;
  }

  if (typeof id !== "string" || !id) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  // Clear this user's mailbox first so we don't strand orphan signals.
  await prisma.signal.deleteMany({
    where: { OR: [{ toId: id }, { fromId: id }] },
  });

  if (peerId && peerId !== id) {
    await prisma.presence.updateMany({
      where: { id: { in: [id, peerId] } },
      data: { busy: false },
    });
    await prisma.signal.create({
      data: { fromId: id, toId: peerId, type: "end", payload: null },
    });
  }

  await prisma.presence.deleteMany({ where: { id } });

  return Response.json({ ok: true });
}
