// Server-side moderation helpers — ban duration escalation per report count.

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const BAN_MS = [
  3 * MIN,
  5 * MIN,
  10 * MIN,
  30 * MIN,
  2 * HOUR,
  12 * HOUR,
  24 * HOUR,
  3 * DAY,
  7 * DAY,
  30 * DAY, // counts 10–20
] as const;

export type ModerationRecord = {
  reportCount: number;
  bannedUntil: Date | null;
  permanentBan: boolean;
};

export type BanResult = {
  bannedUntil: Date | null;
  permanentBan: boolean;
};

export function applyReportBan(reportCount: number): BanResult {
  if (reportCount > 20) {
    return { bannedUntil: null, permanentBan: true };
  }
  if (reportCount >= 10) {
    return {
      bannedUntil: new Date(Date.now() + BAN_MS[9]),
      permanentBan: false,
    };
  }
  const duration = BAN_MS[reportCount - 1];
  return {
    bannedUntil: new Date(Date.now() + duration),
    permanentBan: false,
  };
}

export function isBanned(record: ModerationRecord): boolean {
  if (record.permanentBan) return true;
  if (!record.bannedUntil) return false;
  return record.bannedUntil.getTime() > Date.now();
}

export function bannedFingerprintSet(
  records: Array<ModerationRecord & { fingerprint: string }>,
): Set<string> {
  const banned = new Set<string>();
  for (const record of records) {
    if (isBanned(record)) banned.add(record.fingerprint);
  }
  return banned;
}

export function formatBanMessage(
  bannedUntil: Date | null,
  permanent: boolean,
): string {
  if (permanent) {
    return "Your access has been permanently restricted due to repeated reports.";
  }
  if (!bannedUntil) {
    return "Your access is temporarily restricted.";
  }
  const remaining = formatRemainingBan(bannedUntil);
  return `Your access is restricted for ${remaining}.`;
}

export function formatRemainingBan(bannedUntil: Date | null): string {
  if (!bannedUntil) return "a limited time";
  const remaining = bannedUntil.getTime() - Date.now();
  if (remaining <= 0) return "a limited time";
  const mins = Math.ceil(remaining / MIN);
  if (mins < 60) {
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  const hours = Math.ceil(remaining / HOUR);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const days = Math.ceil(remaining / DAY);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function formatReportedBanMessage(
  bannedUntil: Date | null,
  permanent: boolean,
): string {
  if (permanent) {
    return "You were reported and can no longer connect to Pulse.";
  }
  const duration = formatRemainingBan(bannedUntil);
  return `You were reported and cannot connect for ${duration}.`;
}

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "inappropriate",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export function isValidReportReason(value: string): value is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(value);
}

export function isValidFingerprint(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 16 &&
    value.length <= 64 &&
    /^[a-zA-Z0-9]+$/.test(value)
  );
}
