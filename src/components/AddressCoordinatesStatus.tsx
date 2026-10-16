/** @format */

import { AlertTriangle, Loader2, MapPin } from "lucide-react";
import type { Coordinates } from "@/lib/geocode";
import type { CoordinatesStatus } from "@/hooks/use-address-coordinates";

interface Props {
  // What's typed in the address field now.
  address: string;
  // The address the status below was worked out for.
  locatedAddress: string | null;
  status: CoordinatesStatus;
  coordinates: Coordinates | null;
}

// One line under the location map: the coordinates that will be saved.
export function AddressCoordinatesStatus({ address, locatedAddress, status, coordinates }: Props) {
  // Typing a new address: wait until the field is left before saying more.
  if (status === "idle" || (status !== "locating" && address.trim() !== locatedAddress)) return null;

  if (status === "locating") {
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
        <Loader2 className="h-3 w-3 animate-spin" />
        Finding this address on the map...
      </p>
    );
  }

  if (status === "found" && coordinates) {
    const { latitude, longitude } = coordinates;
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
        <MapPin className="h-3 w-3 shrink-0 text-gold" />
        Coordinates {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto underline text-gold-dark"
        >
          Check pin
        </a>
      </p>
    );
  }

  return (
    <p className="flex items-start gap-1.5 text-[11px] text-danger">
      <AlertTriangle className="h-3 w-3 shrink-0 mt-px" />
      {status === "error"
        ? "Couldn't reach the map service. The address will be looked up again when you save."
        : "Couldn't find this address on the map, so no coordinates will be saved. Try adding the street, city and state."}
    </p>
  );
}
