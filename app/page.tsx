"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EntryGate from "./components/EntryGate/EntryGate";
import WorldMap from "./components/WorldMap";
import ConnectionPrompt from "./components/ConnectionPrompt";
import IncomingVideoCall from "./components/IncomingVideoCall";
import OutgoingVideoCall from "./components/OutgoingVideoCall";
import OutgoingConnectionRequest from "./components/OutgoingConnectionRequest";
import PeerProfileModal from "./components/PeerProfileModal";
import ChatPanel, { type ChatMessage } from "./components/ChatPanel";
import VideoPanel from "./components/VideoPanel";
import GlobeWelcomeDialog from "./components/GlobeWelcomeDialog";
import ReportUserDialog from "./components/ReportUserDialog";
import BanAlertPanel from "./components/BanAlertPanel";
import { join, leave, poll, reportUser, sendSignal, ReportError } from "@/lib/api";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import type { ReportReason } from "@/lib/moderation";
import type { SessionProfile } from "@/lib/profile";
import { dismissWelcome, isWelcomeDismissed } from "@/lib/welcome";
import { playConnectionRequestSound } from "@/lib/notificationSounds";
import {
  filterPeers,
  type PeerMapFilters,
} from "@/lib/filterPeers";
import { PeerSession, type DescType, type PeerControl } from "@/lib/webrtc";
import { POLL_INTERVAL_MS } from "@/lib/presence";
import { type BanStatus, type PeerDot, type SignalMsg } from "@/lib/types";

type Conn =
  | { kind: "idle" }
  | { kind: "requesting"; peerId: string }
  | { kind: "incoming"; peerId: string }
  | { kind: "connecting"; peerId: string }
  | { kind: "connected"; peerId: string };

type VideoState = "none" | "requesting" | "incoming" | "active";

const REQUEST_TIMEOUT_MS = 30_000;

export default function Home() {
  const [phase, setPhase] = useState<"gate" | "live">("gate");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [peers, setPeers] = useState<PeerDot[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteCameraOn, setRemoteCameraOn] = useState(true);
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [previewPeerId, setPreviewPeerId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<SessionProfile | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [mapFilters, setMapFilters] = useState<PeerMapFilters>({
    sharedTagsOnly: false,
    moodId: null,
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportedPeerIds, setReportedPeerIds] = useState<string[]>([]);
  const [banAlert, setBanAlert] = useState<BanStatus | null>(null);

  const [conn, _setConn] = useState<Conn>({ kind: "idle" });
  const connRef = useRef<Conn>(conn);
  const setConn = (c: Conn) => {
    connRef.current = c;
    _setConn(c);
  };

  const [video, _setVideo] = useState<VideoState>("none");
  const videoRef = useRef<VideoState>(video);
  const setVideo = (v: VideoState) => {
    videoRef.current = v;
    _setVideo(v);
  };

  const peerRef = useRef<PeerSession | null>(null);
  const msgId = useRef(0);
  const requestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const banActiveRef = useRef(false);

  useEffect(() => {
    void getDeviceFingerprint().catch(() => {
      // Fingerprint loads again at join if this prefetch fails.
    });
  }, []);

  function setRemoteTyping(active: boolean) {
    if (peerTypingTimer.current) clearTimeout(peerTypingTimer.current);
    setPeerTyping(active);
    if (active) {
      peerTypingTimer.current = setTimeout(() => setPeerTyping(false), 5_000);
    }
  }

  function showNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 3500);
  }

  function addMessage(mine: boolean, text: string) {
    setMessages((prev) => [...prev, { id: msgId.current++, mine, text }]);
  }

  function teardown(message?: string) {
    if (requestTimer.current) clearTimeout(requestTimer.current);
    if (peerTypingTimer.current) clearTimeout(peerTypingTimer.current);
    peerRef.current?.close();
    peerRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteCameraOn(true);
    setVideo("none");
    setMessages([]);
    setPeerTyping(false);
    setConn({ kind: "idle" });
    if (message && !banActiveRef.current) showNotice(message);
  }

  const disconnectForBan = useCallback(() => {
    if (requestTimer.current) clearTimeout(requestTimer.current);
    if (peerTypingTimer.current) clearTimeout(peerTypingTimer.current);
    peerRef.current?.close();
    peerRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteCameraOn(true);
    setVideo("none");
    setMessages([]);
    setPeerTyping(false);
    setConn({ kind: "idle" });
    setPreviewPeerId(null);
    setReportOpen(false);
  }, []);

  function startPeer(peerId: string, initiator: boolean) {
    const ps = new PeerSession(initiator, {
      onSignal: (type: DescType, payload: string) => {
        void sendSignal(sessionId, peerId, type, payload);
      },
      onChat: (text) => {
        setRemoteTyping(false);
        addMessage(false, text);
      },
      onControl: (ctrl) => handleControl(ctrl),
      onTyping: setRemoteTyping,
      onVideoState: setRemoteCameraOn,
      onRemoteStream: (stream) => setRemoteStream(stream),
      onConnectionState: (state) => {
        if (state === "failed") {
          teardown("Stranger disconnected.");
        }
      },
      onChannelOpen: () => {
        setConn({ kind: "connected", peerId });
      },
    });
    peerRef.current = ps;
  }

  function handleControl(ctrl: PeerControl) {
    const ps = peerRef.current;
    switch (ctrl) {
      case "video-request":
        if (videoRef.current === "none") setVideo("incoming");
        break;
      case "video-accept":
        if (videoRef.current === "requesting" && ps) {
          ps.startVideo()
            .then((stream) => {
              setLocalStream(stream);
              setVideo("active");
            })
            .catch(() => {
              setVideo("none");
              ps.sendControl("video-end");
              showNotice("Camera unavailable.");
            });
        }
        break;
      case "video-decline":
        if (videoRef.current === "requesting") {
          setVideo("none");
          showNotice("Video declined.");
        }
        break;
      case "video-end":
        ps?.stopVideo();
        setLocalStream(null);
        setRemoteStream(null);
        setRemoteCameraOn(true);
        setVideo("none");
        break;
    }
  }

  function handlePeerClick(peerId: string) {
    if (peers.some((p) => p.id === peerId)) setPreviewPeerId(peerId);
  }

  function requestConnection(peerId: string) {
    if (connRef.current.kind !== "idle" || banActiveRef.current) return;
    const peer = peers.find((p) => p.id === peerId);
    if (peer?.banned) {
      showNotice("This user is restricted and cannot be contacted.");
      return;
    }
    setConn({ kind: "requesting", peerId });
    void sendSignal(sessionId, peerId, "request").catch((err) => {
      if (err instanceof Error && err.message === "banned") {
        teardown("Your access is restricted. You cannot start new chats.");
      }
    });
    requestTimer.current = setTimeout(() => {
      if (
        connRef.current.kind === "requesting" &&
        connRef.current.peerId === peerId
      ) {
        void sendSignal(sessionId, peerId, "end");
        teardown("No answer.");
      }
    }, REQUEST_TIMEOUT_MS);
  }

  function cancelRequest() {
    if (connRef.current.kind === "requesting") {
      void sendSignal(sessionId, connRef.current.peerId, "end");
    }
    teardown();
  }

  function acceptIncoming() {
    if (connRef.current.kind !== "incoming") return;
    const peerId = connRef.current.peerId;
    const peer = peers.find((p) => p.id === peerId);
    if (peer?.banned) {
      void sendSignal(sessionId, peerId, "decline");
      setConn({ kind: "idle" });
      showNotice("This user is restricted and cannot be contacted.");
      return;
    }
    startPeer(peerId, false);
    void sendSignal(sessionId, peerId, "accept");
    setConn({ kind: "connecting", peerId });
  }

  function declineIncoming() {
    if (connRef.current.kind !== "incoming") return;
    void sendSignal(sessionId, connRef.current.peerId, "decline");
    setConn({ kind: "idle" });
  }

  function endConnection() {
    const c = connRef.current;
    if (c.kind === "connecting" || c.kind === "connected") {
      void sendSignal(sessionId, c.peerId, "end");
    }
    teardown();
  }

  function startVideoRequest() {
    if (videoRef.current !== "none" || !peerRef.current) return;
    setVideo("requesting");
    peerRef.current.sendControl("video-request");
  }

  function acceptVideo() {
    const ps = peerRef.current;
    if (!ps) return;
    ps.startVideo()
      .then((stream) => {
        setLocalStream(stream);
        ps.sendControl("video-accept");
        setVideo("active");
      })
      .catch(() => {
        ps.sendControl("video-decline");
        setVideo("none");
        showNotice("Camera unavailable.");
      });
  }

  function declineVideo() {
    peerRef.current?.sendControl("video-decline");
    setVideo("none");
  }

  function cancelVideoRequest() {
    peerRef.current?.sendControl("video-end");
    setVideo("none");
  }

  function endVideo() {
    const ps = peerRef.current;
    ps?.stopVideo();
    ps?.sendControl("video-end");
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteCameraOn(true);
    setVideo("none");
  }

  function processSignal(sig: SignalMsg) {
    switch (sig.type) {
      case "request": {
        const requester = peers.find((p) => p.id === sig.fromId);
        if (requester?.banned) {
          void sendSignal(sessionId, sig.fromId, "decline");
          break;
        }
        if (connRef.current.kind === "idle") {
          setConn({ kind: "incoming", peerId: sig.fromId });
        } else {
          void sendSignal(sessionId, sig.fromId, "decline");
        }
        break;
      }
      case "accept": {
        const c = connRef.current;
        if (c.kind === "requesting" && c.peerId === sig.fromId) {
          if (requestTimer.current) clearTimeout(requestTimer.current);
          startPeer(sig.fromId, true);
          setConn({ kind: "connecting", peerId: sig.fromId });
        }
        break;
      }
      case "decline": {
        const c = connRef.current;
        if (c.kind === "requesting" && c.peerId === sig.fromId) {
          if (requestTimer.current) clearTimeout(requestTimer.current);
          const declinedPeer = peers.find((p) => p.id === sig.fromId);
          teardown(
            declinedPeer?.banned
              ? "This user is restricted and cannot be contacted."
              : "Request declined.",
          );
        }
        break;
      }
      case "offer":
      case "answer":
      case "ice": {
        const c = connRef.current;
        const peerId =
          c.kind === "connecting" || c.kind === "connected" ? c.peerId : null;
        if (peerRef.current && peerId === sig.fromId) {
          void peerRef.current.handleSignal(
            sig.type as DescType,
            sig.payload ?? ""
          );
        }
        break;
      }
      case "end": {
        const c = connRef.current;
        if (
          (c.kind === "incoming" ||
            c.kind === "connecting" ||
            c.kind === "connected") &&
          c.peerId === sig.fromId
        ) {
          if (c.kind === "incoming") setConn({ kind: "idle" });
          else teardown(banActiveRef.current ? undefined : "Stranger disconnected.");
        }
        break;
      }
    }
  }

  const processSignalRef = useRef(processSignal);
  useEffect(() => {
    processSignalRef.current = processSignal;
  });

  useEffect(() => {
    if (phase !== "live" || !sessionId) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const data = await poll(sessionId);
        if (!active) return;

        if (data.ban) {
          banActiveRef.current = true;
          setBanAlert(data.ban);
          if (connRef.current.kind !== "idle") {
            disconnectForBan();
          }
        } else {
          banActiveRef.current = false;
          setBanAlert(null);
        }

        setPeers(data.peers);
        for (const s of data.signals) processSignalRef.current(s);
      } catch {}
      if (active) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [phase, sessionId, disconnectForBan]);

  useEffect(() => {
    if (!sessionId || phase !== "live") return;
    const onLeave = () => {
      const c = connRef.current;
      const peerId =
        c.kind === "requesting" ||
        c.kind === "incoming" ||
        c.kind === "connecting" ||
        c.kind === "connected"
          ? c.peerId
          : undefined;
      leave(sessionId, peerId);
    };
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [sessionId, phase]);

  useEffect(() => {
    const c = connRef.current;
    if (
      (c.kind === "connecting" || c.kind === "connected") &&
      !peers.some((p) => p.id === c.peerId)
    ) {
      teardown("Stranger disconnected.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- conn via ref; teardown on peer offline
  }, [peers]);

  const incomingConnectionPeerId =
    conn.kind === "incoming" ? conn.peerId : null;

  useEffect(() => {
    if (!incomingConnectionPeerId) return;
    playConnectionRequestSound();
  }, [incomingConnectionPeerId]);

  async function handleReady(
    lat: number,
    lng: number,
    profile: SessionProfile,
    turnstileToken: string,
  ) {
    const fingerprint = await getDeviceFingerprint();
    await join(sessionId, lat, lng, profile, fingerprint, turnstileToken);
    setMyLocation({ lat, lng });
    setMyProfile(profile);
    setPhase("live");
    if (!isWelcomeDismissed()) setWelcomeOpen(true);
  }

  async function handleReportSubmit(reason: ReportReason, details?: string) {
    if (!connectedPeerId) return;
    const reportedId = connectedPeerId;
    setReportSubmitting(true);
    setReportError(null);
    try {
      await reportUser(sessionId, reportedId, reason, details);
      setReportedPeerIds((prev) =>
        prev.includes(reportedId) ? prev : [...prev, reportedId],
      );
      setReportOpen(false);
      endConnection();
      showNotice("Report submitted. Thank you for helping keep Pulse safe.");
    } catch (err) {
      if (err instanceof ReportError) {
        setReportError(err.message);
        if (err.code === "already_reported") {
          setReportedPeerIds((prev) =>
            prev.includes(reportedId) ? prev : [...prev, reportedId],
          );
        }
      } else {
        setReportError("Could not submit report. Please try again.");
      }
    } finally {
      setReportSubmitting(false);
    }
  }

  const connectedPeerId =
    conn.kind === "connecting" || conn.kind === "connected"
      ? conn.peerId
      : null;
  const visiblePeers = useMemo(
    () =>
      filterPeers(
        peers,
        myProfile?.tags ?? [],
        mapFilters,
        connectedPeerId
      ),
    [peers, myProfile?.tags, mapFilters, connectedPeerId]
  );

  if (phase === "gate") {
    return <EntryGate onReady={handleReady} />;
  }

  const inChat = conn.kind === "connecting" || conn.kind === "connected";
  const previewPeer = previewPeerId
    ? (peers.find((p) => p.id === previewPeerId) ?? null)
    : null;
  const incomingPeer =
    conn.kind === "incoming"
      ? (peers.find((p) => p.id === conn.peerId) ?? null)
      : null;
  const requestingPeer =
    conn.kind === "requesting"
      ? (peers.find((p) => p.id === conn.peerId) ?? null)
      : null;
  const chatPeer = connectedPeerId
    ? (peers.find((p) => p.id === connectedPeerId) ?? null)
    : null;

  return (
    <main className="fixed inset-0 overflow-hidden">
      <GlobeWelcomeDialog
        open={welcomeOpen}
        nickname={myProfile?.nickname}
        onContinue={(dontShowAgain) => {
          if (dontShowAgain) dismissWelcome();
          setWelcomeOpen(false);
        }}
      />

      <ReportUserDialog
        open={reportOpen}
        nickname={chatPeer?.nickname}
        submitting={reportSubmitting}
        error={reportError}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) setReportError(null);
        }}
        onSubmit={handleReportSubmit}
      />

      <WorldMap
        peers={visiblePeers}
        totalPeerCount={peers.length}
        me={myLocation}
        onPeerClick={handlePeerClick}
        canConnect={conn.kind === "idle" && !banAlert}
        connectedPeerId={connectedPeerId}
        mapFilters={mapFilters}
        onMapFiltersChange={setMapFilters}
        hasTags={(myProfile?.tags.length ?? 0) > 0}
      />

      {previewPeer && (
        <PeerProfileModal
          peer={previewPeer}
          onCancel={() => setPreviewPeerId(null)}
          onConnect={() => {
            const peerId = previewPeer.id;
            setPreviewPeerId(null);
            requestConnection(peerId);
          }}
        />
      )}

      {banAlert && <BanAlertPanel ban={banAlert} />}

      {notice && (
        <div className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full bg-zinc-800/90 px-4 py-2 text-sm text-zinc-100 shadow-lg backdrop-blur">
          {notice}
        </div>
      )}

      {conn.kind === "requesting" && (
        <OutgoingConnectionRequest
          peer={requestingPeer}
          onCancel={cancelRequest}
        />
      )}

      {conn.kind === "incoming" && incomingPeer && (
        <PeerProfileModal
          peer={incomingPeer}
          header="Wants to connect with you"
          primaryLabel="Accept"
          secondaryLabel="Decline"
          showBusyNote={false}
          onConnect={acceptIncoming}
          onCancel={declineIncoming}
        />
      )}

      {conn.kind === "incoming" && !incomingPeer && (
        <ConnectionPrompt
          title="Someone wants to connect"
          acceptLabel="Accept"
          declineLabel="Decline"
          onAccept={acceptIncoming}
          onDecline={declineIncoming}
        />
      )}

      {inChat && (
        <ChatPanel
          className={video === "active" ? "max-md:z-30" : undefined}
          messages={messages}
          connected={conn.kind === "connected"}
          peerTyping={peerTyping}
          videoBusy={video !== "none"}
          nickname={chatPeer?.nickname}
          avatar={chatPeer?.avatar}
          onSend={(text) => {
            peerRef.current?.sendTyping(false);
            peerRef.current?.sendChat(text);
            addMessage(true, text);
          }}
          onTypingChange={(active) => peerRef.current?.sendTyping(active)}
          onStartVideo={startVideoRequest}
          onEnd={endConnection}
          onReport={() => setReportOpen(true)}
          reportDisabled={
            connectedPeerId
              ? reportedPeerIds.includes(connectedPeerId)
              : false
          }
        />
      )}

      {video === "requesting" && (
        <OutgoingVideoCall
          nickname={chatPeer?.nickname}
          avatar={chatPeer?.avatar}
          onCancel={cancelVideoRequest}
        />
      )}

      {video === "incoming" && (
        <IncomingVideoCall
          nickname={chatPeer?.nickname}
          avatar={chatPeer?.avatar}
          onAccept={acceptVideo}
          onDecline={declineVideo}
        />
      )}

      {video === "active" && (
        <VideoPanel
          localStream={localStream}
          remoteStream={remoteStream}
          remoteCameraOn={remoteCameraOn}
          onCameraChange={(cameraOn) =>
            peerRef.current?.sendVideoState(cameraOn)
          }
          onEnd={endVideo}
        />
      )}
    </main>
  );
}
