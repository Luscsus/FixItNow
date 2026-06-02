/** "850 m" / "1.2 km" from a metre value. */
export function formatDistance(meters: number | null): string {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** "~3 min" / "~1 h 5 min" from a seconds value. */
export function formatEta(seconds: number | null): string {
  if (seconds == null) return "—";
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}

interface NavCoords {
  destLat: number;
  destLng: number;
  /** Provider's current position; when present it pre-fills the route origin. */
  originLat?: number | null;
  originLng?: number | null;
}

/**
 * Google Maps driving-directions URL. When the origin (provider's live
 * position) is known we pass it explicitly so both ends are pre-filled and the
 * provider can just hit "Start". Otherwise Google Maps falls back to the
 * device's current location.
 */
export function googleMapsDirUrl({ destLat, destLng, originLat, originLng }: NavCoords): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destLat},${destLng}`,
    travelmode: "driving",
  });
  if (originLat != null && originLng != null) {
    params.set("origin", `${originLat},${originLng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Apple Maps driving-directions URL. `saddr` = start, `daddr` = destination,
 * `dirflg=d` = driving. Omitting `saddr` lets Apple Maps use current location.
 */
export function appleMapsDirUrl({ destLat, destLng, originLat, originLng }: NavCoords): string {
  const parts = [`daddr=${destLat},${destLng}`, "dirflg=d"];
  if (originLat != null && originLng != null) {
    parts.unshift(`saddr=${originLat},${originLng}`);
  }
  return `https://maps.apple.com/?${parts.join("&")}`;
}
