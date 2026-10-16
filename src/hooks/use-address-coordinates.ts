/** @format */

import { useCallback, useRef, useState } from "react";
import { geocodeAddress, type Coordinates } from "@/lib/geocode";

export type CoordinatesStatus = "idle" | "locating" | "found" | "not-found" | "error";

interface State {
  // The address these coordinates (or this status) belong to.
  address: string | null;
  coordinates: Coordinates | null;
  status: CoordinatesStatus;
}

const IDLE: State = { address: null, coordinates: null, status: "idle" };

type Coordinate = string | number | null | undefined;

// Keeps a listing's map coordinates in step with its address, for the
// Place and Business forms.
export function useAddressCoordinates() {
  const [state, setState] = useState<State>(IDLE);
  const current = useRef<State>(IDLE);
  // An existing record's coordinates, which belong to its saved address.
  const saved = useRef<State>(IDLE);
  const latestLookup = useRef(0);

  const update = (next: State) => {
    current.current = next;
    setState(next);
  };

  const load = useCallback((address: string, latitude: Coordinate, longitude: Coordinate) => {
    const has = (v: Coordinate) => v !== null && v !== undefined && v !== "";
    saved.current =
      has(latitude) && has(longitude)
        ? { address: address.trim(), coordinates: { latitude: String(latitude), longitude: String(longitude) }, status: "found" }
        : IDLE;
    update(saved.current);
  }, []);

  // Coordinates for the address, looked up unless they're already known.
  // Resolves to null when they can't be found.
  const locate = useCallback(async (address: string): Promise<Coordinates | null> => {
    const query = address.trim();
    if (!query) {
      update(IDLE);
      return null;
    }
    if (query === saved.current.address) {
      update(saved.current);
      return saved.current.coordinates;
    }
    const known = current.current;
    if (query === known.address && (known.status === "found" || known.status === "not-found")) return known.coordinates;

    const lookup = ++latestLookup.current;
    update({ address: query, coordinates: null, status: "locating" });
    try {
      const coordinates = await geocodeAddress(query);
      if (lookup === latestLookup.current) update({ address: query, coordinates, status: coordinates ? "found" : "not-found" });
      return coordinates;
    } catch {
      if (lookup === latestLookup.current) update({ address: query, coordinates: null, status: "error" });
      return null;
    }
  }, []);

  return { ...state, load, locate };
}
