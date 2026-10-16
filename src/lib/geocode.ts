/** @format */

// Address -> coordinates via OpenStreetMap's free Nominatim service. Google's
// Geocoding API is billed per call, which the backend docs rule out
// (marco_passport_backend/docs/frontend-handoff.md, "Do not use").
//
// Nominatim's usage policy: at most one request a second and no lookups as
// the user types, so addresses are only looked up once they're finished
// (on blur and on save), and repeat lookups come from the cache.
// https://operations.osmfoundation.org/policies/nominatim/

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const MIN_INTERVAL_MS = 1100;

export interface Coordinates {
  // Strings with 8 decimals, matching the backend's DECIMAL columns.
  latitude: string;
  longitude: string;
}

let nextRequestAt = 0;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const search = async (query: string): Promise<Coordinates | null> => {
  const delay = nextRequestAt - Date.now();
  nextRequestAt = Math.max(Date.now(), nextRequestAt) + MIN_INTERVAL_MS;
  if (delay > 0) await wait(delay);

  const res = await fetch(`${ENDPOINT}?${new URLSearchParams({ q: query, format: "jsonv2", limit: "1" })}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Map lookup failed (${res.status}).`);
  const [hit] = (await res.json()) as { lat: string; lon: string }[];
  return hit ? { latitude: Number(hit.lat).toFixed(8), longitude: Number(hit.lon).toFixed(8) } : null;
};

// Suite/unit numbers often stop OpenStreetMap from matching a street address.
const withoutUnit = (address: string) =>
  address.replace(/,?\s*(?:suite|ste\.?|unit|apt\.?|apartment|#)\s*[\w-]+/gi, "").trim();

const cache = new Map<string, Promise<Coordinates | null>>();

// Resolves to null when the address can't be found; rejects when the service
// can't be reached.
export const geocodeAddress = (address: string): Promise<Coordinates | null> => {
  const query = address.trim();
  if (!query) return Promise.resolve(null);
  if (!cache.has(query)) {
    const lookup = (async () => {
      const found = await search(query);
      if (found) return found;
      const fallback = withoutUnit(query);
      return fallback && fallback !== query ? search(fallback) : null;
    })();
    // Don't cache failures, so the next attempt tries again.
    lookup.catch(() => cache.delete(query));
    cache.set(query, lookup);
  }
  return cache.get(query)!;
};
