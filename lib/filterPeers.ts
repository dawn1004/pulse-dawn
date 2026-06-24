import type { PeerDot } from "@/lib/types";

export type PeerMapFilters = {
  sharedTagsOnly: boolean;
  moodId: string | null;
};

export function filterPeers(
  peers: PeerDot[],
  myTags: string[],
  filters: PeerMapFilters,
  connectedPeerId: string | null
): PeerDot[] {
  let list = peers;

  if (filters.sharedTagsOnly && myTags.length > 0) {
    const tagSet = new Set(myTags);
    list = list.filter((p) => p.tags.some((t) => tagSet.has(t)));
  }

  if (filters.moodId) {
    list = list.filter((p) => p.avatar === filters.moodId);
  }

  if (connectedPeerId) {
    const connected = peers.find((p) => p.id === connectedPeerId);
    if (connected && !list.some((p) => p.id === connectedPeerId)) {
      list = [...list, connected];
    }
  }

  return list;
}

export function isPeerMapFilterActive(filters: PeerMapFilters): boolean {
  return filters.sharedTagsOnly || filters.moodId !== null;
}
