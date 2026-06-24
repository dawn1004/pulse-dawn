"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import { Users } from "lucide-react";
import type { PeerDot } from "@/lib/types";
import { formatDistanceKm, haversineDistanceKm } from "@/lib/geo";
import { Badge } from "@/components/ui/badge";
import type { PeerMapFilters } from "@/lib/filterPeers";
import MapDotLegend from "./MapDotLegend";
import MapPeerFilters from "./MapPeerFilters";

function resolveMapboxToken(): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token || token.includes("your_mapbox_token")) return "";
  return token;
}

const TOKEN = resolveMapboxToken();

function dotTitle(
  peer: { id: string; lat: number; lng: number; busy: boolean; banned: boolean },
  connectedPeerId: string | null,
  me: { lat: number; lng: number } | null,
): string {
  let status: string;
  if (connectedPeerId === peer.id) {
    status = "Connected with you";
  } else if (peer.banned) {
    status = "Restricted — cannot connect";
  } else if (peer.busy) {
    status = "Unavailable — in a conversation";
  } else {
    status = "Available — view profile";
  }

  if (!me) return status;

  const distance = formatDistanceKm(
    haversineDistanceKm(me.lat, me.lng, peer.lat, peer.lng),
  );
  return `${status} · ${distance}`;
}

function applyDotState(
  el: HTMLButtonElement,
  peer: { id: string; lat: number; lng: number; busy: boolean; banned: boolean },
  connectedPeerId: string | null,
  me: { lat: number; lng: number } | null,
) {
  el.classList.remove(
    "pulse-dot--available",
    "pulse-dot--busy",
    "pulse-dot--connected",
    "pulse-dot--banned"
  );
  if (connectedPeerId === peer.id) {
    el.classList.add("pulse-dot--connected");
  } else if (peer.banned) {
    el.classList.add("pulse-dot--banned");
  } else if (peer.busy) {
    el.classList.add("pulse-dot--busy");
  } else {
    el.classList.add("pulse-dot--available");
  }
  el.title = dotTitle(peer, connectedPeerId, me);
}

export default function WorldMap({
  peers,
  totalPeerCount,
  me,
  onPeerClick,
  canConnect,
  connectedPeerId,
  mapFilters,
  onMapFiltersChange,
  hasTags,
}: {
  peers: PeerDot[];
  totalPeerCount: number;
  me: { lat: number; lng: number } | null;
  onPeerClick: (id: string) => void;
  canConnect: boolean;
  connectedPeerId: string | null;
  mapFilters: PeerMapFilters;
  onMapFiltersChange: (filters: PeerMapFilters) => void;
  hasTags: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const meMarkerRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Marker click handlers are bound once, so read the live click handler +
  // connectability through refs (synced in an effect, never during render).
  const onPeerClickRef = useRef(onPeerClick);
  const canConnectRef = useRef(canConnect);
  useEffect(() => {
    onPeerClickRef.current = onPeerClick;
    canConnectRef.current = canConnect;
  });

  // Initialise the map once.
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    const markers = markersRef.current;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        // Open centered on the user if we know where they are, else world view.
        center: me ? [me.lng, me.lat] : [0, 20],
        zoom: me ? 4 : 1.4,
        attributionControl: true,
      });
      map.on("load", () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      markers.forEach((m) => m.remove());
      markers.clear();
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // `me` is only read for the initial center; we don't want to re-init on change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show / move the user's own "you are here" pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !me) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      if (!meMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "pulse-me";
        el.title = "You are here";
        el.innerHTML = `<span class="pulse-me-label">Me</span>📍`;
        // anchor "bottom" → the pin's tip sits on the exact coordinate.
        meMarkerRef.current = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([me.lng, me.lat])
          .addTo(map);
      } else {
        meMarkerRef.current.setLngLat([me.lng, me.lat]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me, ready]);

  // Reconcile markers whenever the peer list changes (or the map becomes ready).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      const markers = markersRef.current;
      const seen = new Set<string>();

      for (const peer of peers) {
        seen.add(peer.id);
        let marker = markers.get(peer.id);
        if (!marker) {
          const el = document.createElement("button");
          el.className = "pulse-dot";
          applyDotState(el, peer, connectedPeerId, me);
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            if (canConnectRef.current) onPeerClickRef.current(peer.id);
          });
          marker = new mapboxgl.Marker({ element: el })
            .setLngLat([peer.lng, peer.lat])
            .addTo(map);
          markers.set(peer.id, marker);
        } else {
          applyDotState(
            marker.getElement() as HTMLButtonElement,
            peer,
            connectedPeerId,
            me
          );
        }
      }

      // Drop markers for peers that went offline / got filtered out.
      for (const [id, marker] of markers) {
        if (!seen.has(id)) {
          marker.remove();
          markers.delete(id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [peers, ready, connectedPeerId, me]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full bg-zinc-900" />

      {!TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="max-w-md rounded-lg bg-zinc-800 p-4 text-sm text-zinc-200">
            Set{" "}
            <code className="text-emerald-400">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
            in <code>.env</code> to load the map.
          </p>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex w-fit max-w-[min(100%,20rem)] flex-col gap-2">
        <Badge
          variant="secondary"
          className="h-auto w-full justify-start gap-1.5 border-border/60 bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-lg backdrop-blur supports-backdrop-filter:bg-card/80"
        >
          <Users className="size-3.5 text-primary" aria-hidden />
          <span>
            {totalPeerCount !== peers.length
              ? `${peers.length} of ${totalPeerCount} `
              : `${peers.length} `}
            {peers.length === 1 ? "person" : "people"} online
          </span>
        </Badge>

        <MapDotLegend />
      </div>

      <MapPeerFilters
        filters={mapFilters}
        onFiltersChange={onMapFiltersChange}
        hasTags={hasTags}
      />
    </div>
  );
}
