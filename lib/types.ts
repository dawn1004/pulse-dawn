// Shared types across client + API.

// Signal mailbox message types.
export type SignalType =
  | "request" // connection request (tap a dot)
  | "accept" // recipient accepted
  | "decline" // recipient declined (or auto-declined while busy)
  | "offer" // WebRTC SDP offer
  | "answer" // WebRTC SDP answer
  | "ice" // WebRTC ICE candidate
  | "end"; // hang up / leave the connection

export interface PresenceRow {
  id: string;
  lat: number;
  lng: number;
  busy: boolean;
  lastSeen: string;
  nickname: string;
  aboutMe: string;
  avatar: string;
  tags: string[];
}

export interface PeerDot {
  id: string;
  lat: number;
  lng: number;
  busy: boolean;
  banned: boolean;
  nickname: string;
  aboutMe: string;
  avatar: string;
  tags: string[];
}

export interface SignalMsg {
  id: string;
  fromId: string;
  toId: string;
  type: SignalType;
  payload: string | null;
  createdAt: string;
}

export interface PollResponse {
  peers: PeerDot[];
  signals: SignalMsg[];
  ban?: BanStatus | null;
}

export interface BanStatus {
  message: string;
  bannedUntil: string | null;
  permanentBan: boolean;
}

export type { ReportReason } from "@/lib/moderation";

export class ReportError extends Error {
  constructor(
    message: string,
    readonly code: "already_reported" | "invalid" | "unknown",
  ) {
    super(message);
    this.name = "ReportError";
  }
}
