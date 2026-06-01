/** Live tracking snapshot — mirrors the backend TrackingUpdateResponse. */
export interface TrackingSnapshot {
  ticketId: number;
  providerLat: number | null;
  providerLng: number | null;
  heading: number | null;
  destLat: number | null;
  destLng: number | null;
  /** Human-readable destination address (shown to the provider). */
  destAddress: string | null;
  /** Remaining driving distance in metres, or null when unavailable. */
  distanceMeters: number | null;
  /** Remaining driving time in seconds, or null when unavailable. */
  etaSeconds: number | null;
  /** True once the provider has crossed the proximity threshold. */
  nearby: boolean;
  updatedAt: string | null;
}

/** Inbound STOMP payload published by the provider's browser. */
export interface ProviderLocationUpdate {
  ticketId: number;
  lat: number;
  lng: number;
  heading?: number | null;
}
