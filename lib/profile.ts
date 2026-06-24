import { AVATARS, TAGS } from "@/app/constants";

const STORAGE_KEY = "pulse-profile";

export const NICKNAME_MAX = 32;
export const ABOUT_ME_MAX = 500;
export const MAX_TAGS = 10;

export type SessionProfile = {
  nickname: string;
  aboutMe: string;
  avatar: string;
  tags: string[];
};

export type SavedProfile = SessionProfile & {
  recoverData: boolean;
};

const AVATAR_IDS = new Set<string>(AVATARS.map((a) => a.id));
const TAG_SET = new Set<string>(TAGS);

export function parseSessionProfile(
  data: unknown
): { ok: true; profile: SessionProfile } | { ok: false; error: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "invalid profile" };
  }
  const p = data as Record<string, unknown>;

  if (typeof p.nickname !== "string") {
    return { ok: false, error: "invalid nickname" };
  }
  const nickname = p.nickname.trim();
  if (!nickname || nickname.length > NICKNAME_MAX) {
    return { ok: false, error: "invalid nickname" };
  }

  if (typeof p.aboutMe !== "string" || p.aboutMe.length > ABOUT_ME_MAX) {
    return { ok: false, error: "invalid aboutMe" };
  }
  const aboutMe = p.aboutMe.trim();

  if (typeof p.avatar !== "string" || !AVATAR_IDS.has(p.avatar)) {
    return { ok: false, error: "invalid avatar" };
  }

  if (
    !Array.isArray(p.tags) ||
    p.tags.length === 0 ||
    p.tags.length > MAX_TAGS
  ) {
    return { ok: false, error: "invalid tags" };
  }
  if (!p.tags.every((t) => typeof t === "string" && TAG_SET.has(t))) {
    return { ok: false, error: "invalid tags" };
  }
  const tags = [...new Set(p.tags as string[])];

  return {
    ok: true,
    profile: { nickname, aboutMe, avatar: p.avatar, tags },
  };
}

function isValidSavedProfile(data: unknown): data is SavedProfile {
  const parsed = parseSessionProfile(data);
  if (!parsed.ok) return false;
  const p = data as Record<string, unknown>;
  return typeof p.recoverData === "boolean";
}

export function loadSavedProfile(): SavedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSavedProfile(parsed)) return null;
    const session = parseSessionProfile(parsed);
    if (!session.ok) return null;
    return {
      ...session.profile,
      recoverData: (parsed as SavedProfile).recoverData,
    };
  } catch {
    return null;
  }
}

export function saveProfile(profile: SavedProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
