const labelCache = new Map<string, string>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function formatCoordsFallback(lat: number, lng: number): string {
  const latHem = lat >= 0 ? "N" : "S";
  const lngHem = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${latHem}, ${Math.abs(lng).toFixed(2)}° ${lngHem}`;
}

type GeocodeFeature = {
  text?: string;
  place_name?: string;
};

type GeocodeResponse = {
  features?: GeocodeFeature[];
};

/** Short area label for privacy-offset map coordinates (city / region). */
export async function reverseGeocodeLabel(
  lat: number,
  lng: number,
): Promise<string> {
  const key = cacheKey(lat, lng);
  const cached = labelCache.get(key);
  if (cached) return cached;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token || token.includes("your_mapbox_token")) {
    const fallback = formatCoordsFallback(lat, lng);
    labelCache.set(key, fallback);
    return fallback;
  }

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
    );
    url.searchParams.set("types", "place,locality,neighborhood,region");
    url.searchParams.set("limit", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("access_token", token);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("geocode failed");

    const data = (await res.json()) as GeocodeResponse;
    const feature = data.features?.[0];
    const label =
      feature?.place_name?.split(",").slice(0, 2).join(",").trim() ||
      feature?.text?.trim() ||
      formatCoordsFallback(lat, lng);

    labelCache.set(key, label);
    return label;
  } catch {
    const fallback = formatCoordsFallback(lat, lng);
    labelCache.set(key, fallback);
    return fallback;
  }
}
